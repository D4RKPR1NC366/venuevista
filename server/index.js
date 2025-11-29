const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { sendMFACode, verifyMFACode } = require('./services/mfaService');

const { sendOTP } = require('./services/emailService');
const otpStore = {};

const app = express();

// Configure CORS for split deployment
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://seashell-moose-182220.hostingersite.com',
    'http://seashell-moose-182220.hostingersite.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const reviewsRouter = require('./routes/reviews');
app.use('/api/reviews', reviewsRouter);

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

const passwordResetRouter = require('./routes/passwordReset');
const mfaRouter = require('./routes/mfa');
const bookingsRouter = require('./routes/bookings');
app.use('/api/auth', passwordResetRouter);
app.use('/api/mfa', mfaRouter);
app.use('/api/bookings', bookingsRouter);

const categoriesRouter = require('./routes/categories');
app.use('/api/categories', categoriesRouter);

// Gallery routes
const galleryRouter = require('./routes/gallery');
app.use('/api/gallery', galleryRouter);

// Backup routes
const backupRouter = require('./routes/backup');
app.use('/api/backup', backupRouter);

// Serve gallery images statically
const path = require('path');
app.use('/gallery', express.static(path.join(__dirname, 'public/gallery')));

// Serve review uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create a separate connection for promos database
const ATLAS_URI = 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/';
const promoConnection = mongoose.createConnection(`${ATLAS_URI}promosDatabase`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
promoConnection.on('connected', () => console.log('MongoDB promosDatabase connected!'));
promoConnection.on('error', err => console.error('MongoDB promosDatabase connection error:', err));

// Load Promo model using the promo connection
const promoSchema = require('./models/Promo');
const Promo = promoConnection.model('Promo', promoSchema);

// Make Promo model available to routes
app.locals.Promo = Promo;

// Register promo routes
const promosRouter = require('./routes/promos');
app.use('/api/promos', promosRouter);

// Create a separate connection for schedules/calendar
const scheduleConnection = mongoose.createConnection(`${ATLAS_URI}scheduleCalendar`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
scheduleConnection.on('connected', () => console.log('MongoDB scheduleCalendar connected!'));
scheduleConnection.on('error', err => console.error('MongoDB scheduleCalendar connection error:', err));

// Load Schedule model using the new connection
const scheduleSchema = require('./models/Schedule').schema;
const Schedule = scheduleConnection.model('Schedule', scheduleSchema);
const { SupplierAcceptedSchedule, SupplierDeclinedSchedule } = require('./models/SupplierSchedule');

// Load Appointment model using scheduleConnection
const appointmentSchema = require('./models/Appointment').schema;
const Appointment = scheduleConnection.model('Appointment', appointmentSchema);
// Register appointments API route with correct model
const appointmentsRouter = require('./routes/appointments')(Appointment);
app.use('/api/appointments', appointmentsRouter);

// Initialize models for accepted and declined schedules
const SupplierAccepted = scheduleConnection.model('SupplierAcceptedSchedule', require('./models/SupplierSchedule').SupplierAcceptedSchedule.schema);
const SupplierDeclined = scheduleConnection.model('SupplierDeclinedSchedule', require('./models/SupplierSchedule').SupplierDeclinedSchedule.schema);

// Schedules API endpoints now use the scheduleConnection
app.get('/api/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});


app.post('/api/schedules', async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add schedule' });
  }
});

// DELETE endpoint for schedules (checks all collections)
app.delete('/api/schedules/:id', async (req, res) => {
  try {
    // Try deleting from regular schedules first
    let deleted = await Schedule.findByIdAndDelete(req.params.id);
    
    // If not found, try accepted schedules
    if (!deleted) {
      deleted = await SupplierAccepted.findByIdAndDelete(req.params.id);
    }
    
    // If still not found, try declined schedules
    if (!deleted) {
      deleted = await SupplierDeclined.findByIdAndDelete(req.params.id);
    }
    
    if (!deleted) return res.status(404).json({ error: 'Schedule not found in any collection' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting schedule:', err);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// Update schedule status (accept/decline)
app.put('/api/schedules/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, supplierId, supplierName } = req.body;

    // Find the original schedule
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Create the schedule entry in the appropriate collection
    const scheduleData = {
      ...schedule.toObject(),
      supplierId,
      supplierName,
      status,
      actionDate: new Date(),
      _id: undefined // Allow MongoDB to generate a new ID
    };

    if (status === 'accepted') {
      await SupplierAccepted.create(scheduleData);
    } else if (status === 'declined') {
      await SupplierDeclined.create(scheduleData);
    } else {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Delete from original schedules
    await Schedule.findByIdAndDelete(id);

    res.json({ success: true, message: `Schedule ${status} successfully` });
  } catch (err) {
    console.error('Error updating schedule status:', err);
    res.status(500).json({ error: 'Failed to update schedule status' });
  }
});

// Move these routes before the generic schedules/:id route to prevent path conflicts

// Get accepted schedules for a supplier
app.get('/api/schedules/status/accepted', async (req, res) => {
  try {
    const { supplierId } = req.query;
    console.log('Fetching accepted schedules for supplier:', supplierId);
    const schedules = supplierId 
      ? await SupplierAccepted.find({ supplierId })
      : await SupplierAccepted.find();
    console.log('Found accepted schedules:', schedules);
    res.json(schedules);
  } catch (err) {
    console.error('Error fetching accepted schedules:', err);
    res.status(500).json({ error: 'Failed to fetch accepted schedules' });
  }
});

// Get declined schedules for a supplier
app.get('/api/schedules/status/declined', async (req, res) => {
  try {
    const { supplierId } = req.query;
    console.log('Fetching declined schedules for supplier:', supplierId);
    const schedules = supplierId 
      ? await SupplierDeclined.find({ supplierId })
      : await SupplierDeclined.find();
    console.log('Found declined schedules:', schedules);
    res.json(schedules);
  } catch (err) {
    console.error('Error fetching declined schedules:', err);
    res.status(500).json({ error: 'Failed to fetch declined schedules' });
  }
});


// Import database configuration
const { authConnection, Customer, Supplier } = require('./config/database');

authConnection.on('connected', () => console.log('MongoDB authentication connected!'));
authConnection.on('error', err => console.error('MongoDB authentication connection error:', err));


// Password reset routes are now handled in passwordReset.js


app.get('/api/background-images', async (req, res) => {
  try {
    const images = await BackgroundImage.find();
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});


app.post('/api/background-images', async (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }
    const docs = await BackgroundImage.insertMany(images);
    res.status(201).json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add images' });
  }
});


app.delete('/api/background-images/:id', async (req, res) => {
  try {
    await BackgroundImage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});
const PORT = process.env.PORT || 5051;

// Temporary debug endpoint - REMOVE IN PRODUCTION
app.get('/api/debug/users', async (req, res) => {
  try {
    const customers = await Customer.find({}).select('email firstName lastName');
    const suppliers = await Supplier.find({}).select('email companyName firstName lastName');
    res.json({ 
      customers: customers.length, 
      suppliers: suppliers.length,
      customerEmails: customers.map(c => c.email),
      supplierEmails: suppliers.map(s => s.email)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Regular admin/user login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Try to find user in both collections
    let user = await Customer.findOne({ email });
    let role = 'customer';
    
    if (!user) {
      user = await Supplier.findOne({ email });
      role = 'supplier';
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If MFA is enabled, handle MFA verification
    if (user.mfaEnabled) {
      if (!mfaCode) {
        await sendMFACode(email);
        return res.json({
          requireMFA: true,
          message: 'MFA code sent to email'
        });
      } else {
        const isValid = verifyMFACode(email, mfaCode);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid MFA code' });
        }
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: role },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    res.json({ 
      message: 'Login successful', 
      user: user,
      token,
      role: role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/auth/login-supplier', async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    const supplier = await Supplier.findOne({ email });
    if (!supplier || supplier.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If MFA is enabled, handle MFA verification
    if (supplier.mfaEnabled) {
      if (!mfaCode) {
        // First login attempt without MFA code
        await sendMFACode(email);
        return res.json({
          requireMFA: true,
          message: 'MFA code sent to email'
        });
      } else {
        // Verify MFA code
        const isValid = verifyMFACode(email, mfaCode);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid MFA code' });
        }
      }
    }

    // If we get here, either MFA is not enabled or it was validated successfully
    const token = jwt.sign(
      { id: supplier._id, email: supplier.email, role: 'supplier' },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    res.json({ 
      message: 'Login successful', 
      user: supplier,
      token 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/auth/login-customer', async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    const customer = await Customer.findOne({ email });
    if (!customer || customer.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If MFA is enabled, handle MFA verification
    if (customer.mfaEnabled) {
      if (!mfaCode) {
        // First login attempt without MFA code
        await sendMFACode(email);
        return res.json({
          requireMFA: true,
          message: 'MFA code sent to email'
        });
      } else {
        // Verify MFA code
        const isValid = verifyMFACode(email, mfaCode);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid MFA code' });
        }
      }
    }

    // If we get here, either MFA is not enabled or it was validated successfully
    const token = jwt.sign(
      { id: customer._id, email: customer.email, role: 'customer' },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    res.json({ 
      message: 'Login successful', 
      user: customer,
      token 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



const MONGO_URI = `${ATLAS_URI}ProductsAndServices`;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB ProductsAndServices connected!'))
  .catch(err => console.error('MongoDB ProductsAndServices connection error:', err));


const bgImageConnection = mongoose.createConnection(`${ATLAS_URI}backgroundImages`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
bgImageConnection.on('connected', () => console.log('MongoDB backgroundImages connected!'));
bgImageConnection.on('error', err => console.error('MongoDB backgroundImages connection error:', err));


const bookingConnection = mongoose.createConnection(`${ATLAS_URI}booking`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
bookingConnection.on('connected', () => console.log('MongoDB booking connected!'));
bookingConnection.on('error', err => console.error('MongoDB booking connection error:', err));






const productSchema = new mongoose.Schema({
  images: [String], // Changed to array of strings for multiple images
  title: { type: String, required: true },
  description: String,
  price: String,
  additionals: [{ title: String, price: String, description: String }],
  categoryTitle: String, // reference to category title
});
const Product = mongoose.model('Product', productSchema);

const backgroundImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const BackgroundImage = bgImageConnection.model('BackgroundImage', backgroundImageSchema);


const cartItemSchema = new mongoose.Schema({
  product: Object,
  additionals: { type: [Object], default: [] },
  userEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const CartItem = mongoose.model('CartItem', cartItemSchema);


const bookingBaseSchema = new mongoose.Schema({
  userId: String,
  name: String,
  contact: String,
  email: String,
  eventType: String,
  date: Date,
  eventVenue: String,
  guestCount: Number,
  subTotal: Number, // undiscounted price
  promoId: String, // reference to the promo
  promoTitle: String, // name of the promo
  discountType: String, // percent discount (e.g., "15")
  discount: Number, // calculated discount amount
  totalPrice: Number, // discounted price
  products: [
    {
      image: String,
      title: String,
      price: Number,
      additionals: { type: [Object], default: [] }
    }
  ],
  specialRequest: String,
  service: String,
  details: Object,
  outsidePH: String,
  createdAt: { type: Date, default: Date.now }
});
const PendingBooking = bookingConnection.model('PendingBooking', bookingBaseSchema);
const ApprovedBooking = bookingConnection.model('ApprovedBooking', bookingBaseSchema);
const FinishedBooking = bookingConnection.model('FinishedBooking', bookingBaseSchema);


app.get('/api/cart', async (req, res) => {
  const userEmail = req.query.userEmail;
  if (!userEmail) return res.status(400).json({ error: 'Missing userEmail' });
  const items = await CartItem.find({ userEmail });
  res.json(items);
});


app.post('/api/cart', async (req, res) => {
  const { product, userEmail, additionals } = req.body;
  if (!userEmail || !product) return res.status(400).json({ error: 'Missing userEmail or product' });
  const item = new CartItem({ product, userEmail, additionals: Array.isArray(additionals) ? additionals : [] });
  await item.save();
  res.status(201).json(item);
});


app.delete('/api/cart/:id', async (req, res) => {
  const userEmail = req.query.userEmail;
  if (!userEmail) return res.status(400).json({ error: 'Missing userEmail' });
  const item = await CartItem.findOne({ _id: req.params.id, userEmail });
  if (!item) return res.status(404).json({ error: 'Cart item not found for this user' });
  await CartItem.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


app.get('/api/bookings/pending', async (req, res) => {
  const bookings = await PendingBooking.find();
  res.json(bookings);
});
app.post('/api/bookings/pending', async (req, res) => {
  const bookingData = { ...req.body };
  // Normalize field names: handle both 'subtotal' and 'subTotal'
  if (bookingData.subtotal !== undefined && bookingData.subTotal === undefined) {
    bookingData.subTotal = bookingData.subtotal;
    delete bookingData.subtotal;
  }
  const booking = new PendingBooking(bookingData);
  await booking.save();
  res.status(201).json(booking);
});
app.delete('/api/bookings/pending/:id', async (req, res) => {
  await PendingBooking.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


app.get('/api/bookings/approved', async (req, res) => {
  const bookings = await ApprovedBooking.find();
  res.json(bookings);
});
app.post('/api/bookings/approved', async (req, res) => {
  const bookingData = { ...req.body };
  // Normalize field names: handle both 'subtotal' and 'subTotal'
  if (bookingData.subtotal !== undefined && bookingData.subTotal === undefined) {
    bookingData.subTotal = bookingData.subtotal;
    delete bookingData.subtotal;
  }
  const booking = new ApprovedBooking(bookingData);
  await booking.save();
  res.status(201).json(booking);
});
app.delete('/api/bookings/approved/:id', async (req, res) => {
  await ApprovedBooking.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


app.get('/api/bookings/finished', async (req, res) => {
  const bookings = await FinishedBooking.find();
  res.json(bookings);
});
app.post('/api/bookings/finished', async (req, res) => {
  const bookingData = { ...req.body };
  // Normalize field names: handle both 'subtotal' and 'subTotal'
  if (bookingData.subtotal !== undefined && bookingData.subTotal === undefined) {
    bookingData.subTotal = bookingData.subtotal;
    delete bookingData.subtotal;
  }
  const booking = new FinishedBooking(bookingData);
  await booking.save();
  res.status(201).json(booking);
});
app.delete('/api/bookings/finished/:id', async (req, res) => {
  await FinishedBooking.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


app.get('/', (req, res) => res.send('Server running with MongoDB!'));


app.get('/api/categories', async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

app.post('/api/categories', async (req, res) => {
  const cat = new Category(req.body);
  await cat.save();
  res.status(201).json(cat);
});

app.put('/api/categories/:id', async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(cat);
});

app.delete('/api/categories/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


app.delete('/api/products/category/:categoryTitle', async (req, res) => {
  try {
    const result = await Product.deleteMany({ categoryTitle: req.params.categoryTitle });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/products/:categoryTitle', async (req, res) => {
  try {
    const products = await Product.find({ categoryTitle: req.params.categoryTitle });
    
    // Ensure backward compatibility
    const formattedProducts = products.map(product => {
      const prod = product.toObject();
      // If it's an old product with single image, convert to images array
      if (prod.image && !prod.images) {
        prod.images = [prod.image];
        delete prod.image;
      }
      // Ensure images is always an array
      if (!Array.isArray(prod.images)) {
        prod.images = prod.images ? [prod.images] : [];
      }
      return prod;
    });
    
    res.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const data = req.body;
    // Ensure images is an array
    if (data.image && !data.images) {
      data.images = [data.image];
      delete data.image;
    }
    if (!Array.isArray(data.images)) {
      data.images = data.images ? [data.images] : [];
    }
    const prod = new Product(data);
    await prod.save();
    res.status(201).json(prod);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const data = req.body;
    // Ensure images is an array
    if (data.image && !data.images) {
      data.images = [data.image];
      delete data.image;
    }
    if (!Array.isArray(data.images)) {
      data.images = data.images ? [data.images] : [];
    }
    const prod = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(prod);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});




app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    console.log('Found suppliers:', suppliers);
    res.json(suppliers);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register-supplier', async (req, res) => {
  try {
    console.log('Supplier registration request:', req.body);
    
    const { email, password, companyName, firstName, lastName, middleName, phone } = req.body;
    
    // Validate required fields
    if (!email || !password || !companyName || !firstName || !lastName || !phone) {
      console.log('Missing fields:', { 
        hasEmail: !!email, 
        hasPassword: !!password, 
        hasCompanyName: !!companyName,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasPhone: !!phone
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }
 
    // Check for existing supplier
    const existing = await Supplier.findOne({ email });
    if (existing) {
      console.log('Supplier already exists:', email);
      return res.status(409).json({ error: 'Email address is already registered' });
    }
  
    // Create new supplier with correct field mappings
    const supplier = new Supplier({ 
      email, 
      password, 
      companyName: companyName,  // Use companyName directly
      firstName, 
      lastName, 
      middleName, 
      phone: phone,  // Use phone directly
      contact: phone,
      mfaEnabled: false
    });
    
    console.log('Attempting to save supplier:', {
      email: supplier.email,
      businessName: supplier.businessName,
      phoneNumber: supplier.phoneNumber
    });

    await supplier.save();
    
    console.log('Supplier registered successfully:', {
      id: supplier._id,
      email: supplier.email
    });
    
    res.status(201).json({ 
      message: 'Supplier registered successfully', 
      user: {
        ...supplier.toObject(),
        password: undefined // Don't send password back
      }
    });
  } catch (err) {
    console.error('Supplier registration error:', err);
    // Send more descriptive error message
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: Object.values(err.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});


app.post('/api/auth/register-customer', async (req, res) => {
  try {
    const { email, password, firstName, lastName, middleName, phone } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Customer already exists' });
    }
   
    const customer = new Customer({ email, password, firstName, lastName, middleName, phone, contact: phone });
    await customer.save();
    res.status(201).json({ message: 'Customer registered successfully', user: customer });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Revenue endpoint
app.get('/api/revenue', async (req, res) => {
  try {
    const filter = req.query.filter || 'thisMonth';
    const now = new Date();
    let startDate;

    // Determine start date based on filter
    switch (filter) {
      case 'thisWeek':
        const day = now.getDay();
        const diff = now.getDate() - day;
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'this6Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all relevant bookings
    const [finishedBookings, approvedBookings] = await Promise.all([
      FinishedBooking.find({
        createdAt: { $gte: startDate }
      }),
      ApprovedBooking.find({
        createdAt: { $gte: startDate }
      })
    ]);

    // Combine and process bookings
    const allBookings = [...finishedBookings, ...approvedBookings];
    
    // Initialize array for all months
    const revenueData = Array(12).fill(0).map((_, i) => ({
      month: i,
      value: 0
    }));

    // Calculate revenue for each month
    allBookings.forEach(booking => {
      if (booking.totalPrice && booking.createdAt) {
        const month = booking.createdAt.getMonth();
        revenueData[month].value += booking.totalPrice;
      }
    });

    res.json(revenueData);
  } catch (err) {
    console.error('Revenue calculation error:', err);
    // Return empty data instead of error
    const emptyData = Array(12).fill(0).map((_, i) => ({
      month: i,
      value: 0
    }));
    res.json(emptyData);
  }
});

// Centralize MongoDB connections
Promise.all([
  mongoose.connect(`${ATLAS_URI}ProductsAndServices`, { useNewUrlParser: true, useUnifiedTopology: true }),
  authConnection.asPromise(),
  scheduleConnection.asPromise(),
  bgImageConnection.asPromise(),
  bookingConnection.asPromise(),
  promoConnection.asPromise()
]).then(() => {
  console.log('All MongoDB connections established');
  
  // Initialize backup service
  const backupService = require('./services/backupService');
  console.log('Starting Atlas backup service...');
  backupService.startPeriodicBackup();
  
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log('Atlas backup service is running - data will be synced every 5 minutes');
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});
