require('dotenv').config({ path: '.env.production' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { sendMFACode, verifyMFACode } = require('./services/mfaService');

const { sendOTP } = require('./services/emailService');
const otpStore = {};

const app = express();

// Configure CORS for production
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
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

// Backup routes
const backupRouter = require('./routes/backup');
app.use('/api/backup', backupRouter);

// Gallery routes
const galleryRouter = require('./routes/gallery');
app.use('/api/gallery', galleryRouter);

// Serve gallery images statically
const path = require('path');
app.use('/gallery', express.static(path.join(__dirname, 'public/gallery')));

// Serve review uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create a separate connection for promos database
const promoConnection = mongoose.createConnection(`${process.env.MONGODB_URI}/promosDatabase`, {
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
const scheduleConnection = mongoose.createConnection(`${process.env.MONGODB_URI}/scheduleCalendar`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
scheduleConnection.on('connected', () => console.log('MongoDB scheduleCalendar connected!'));
scheduleConnection.on('error', err => console.error('MongoDB scheduleCalendar connection error:', err));

// Load Schedule model using the new connection
const scheduleSchema = require('./models/Schedule').schema;
const Schedule = scheduleConnection.model('Schedule', scheduleSchema);
const { SupplierAcceptedSchedule, SupplierDeclinedSchedule } = require('./models/SupplierSchedule');

// Create a separate connection for notifications
const notificationConnection = mongoose.createConnection(`${process.env.MONGODB_URI}/notification`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
notificationConnection.on('connected', () => console.log('MongoDB notification database connected!'));
notificationConnection.on('error', err => console.error('MongoDB notification connection error:', err));

// Load Notification model using the notification connection
const notificationSchema = require('./models/Notification').schema;
const Notification = notificationConnection.model('Notification', notificationSchema);

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
    console.log('Fetching all schedules, found:', schedules.length);
    console.log('Schedules:', JSON.stringify(schedules, null, 2));
    res.json(schedules);
  } catch (err) {
    console.error('Error fetching schedules:', err);
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

// Notifications API endpoints
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
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

    // Check if supplier is approved
    if (!supplier.isApproved) {
      return res.status(403).json({ 
        error: 'Account pending approval', 
        message: 'Your supplier account is awaiting admin approval. Please wait for approval before logging in.' 
      });
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

// Verify admin password
app.post('/api/auth/verify-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    
    // Check if password matches admin password
    if (password === 'admin123') {
      res.json({ success: true, message: 'Admin verified' });
    } else {
      res.status(401).json({ error: 'Invalid admin password' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify user password
app.post('/api/auth/verify-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Try to find user in Customer collection
    let user = await Customer.findOne({ email });
    let userType = 'customer';

    // If not found in Customer, try Supplier collection
    if (!user) {
      user = await Supplier.findOne({ email });
      userType = 'supplier';
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare the provided password with stored password
    if (password === user.password) {
      res.json({ success: true, message: 'Password verified', userType });
    } else {
      res.status(401).json({ error: 'Incorrect password' });
    }
  } catch (err) {
    console.error('Error verifying password:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const MONGO_URI = `${process.env.MONGODB_URI}/ProductsAndServices`;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB ProductsAndServices connected!'))
  .catch(err => console.error('MongoDB ProductsAndServices connection error:', err));


const bgImageConnection = mongoose.createConnection(`${process.env.MONGODB_URI}/backgroundImages`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
bgImageConnection.on('connected', () => console.log('MongoDB backgroundImages connected!'));
bgImageConnection.on('error', err => console.error('MongoDB backgroundImages connection error:', err));


const bookingConnection = mongoose.createConnection(`${process.env.MONGODB_URI}/booking`, {
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
  available: { type: Boolean, default: true }, // availability status
  branches: [{ type: String }], // Available in branches
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
  branchLocation: String,
  theme: String,
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
  contractPicture: String, // base64 image string
  suppliers: [{ type: mongoose.Schema.Types.ObjectId }],
  referenceNumber: String, // Reference number for approved bookings (e.g., GC-20251206-2YYKB)
  createdAt: { type: Date, default: Date.now }
}, { strict: false });
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
  
  // Check if product is available before adding to cart
  if (product.available === false) {
    return res.status(400).json({ error: 'This product/service is currently unavailable and cannot be added to cart.' });
  }
  
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

// Get most availed products/services
app.get('/api/bookings/most-availed', async (req, res) => {
  try {
    const filter = req.query.filter;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const branch = req.query.branch || 'all';
    
    // Fetch all bookings
    const [pending, approved, finished] = await Promise.all([
      PendingBooking.find(),
      ApprovedBooking.find(),
      FinishedBooking.find()
    ]);
    
    const allBookings = [...pending, ...approved, ...finished];
    
    // Filter by date if specified
    let filteredBookings = allBookings;
    if (filter && filter !== 'all') {
      const filterMonth = parseInt(filter);
      filteredBookings = allBookings.filter(b => {
        if (!b.createdAt) return false;
        const bookingDate = new Date(b.createdAt);
        return bookingDate.getFullYear() === year && 
               bookingDate.getMonth() === filterMonth;
      });
    } else {
      // If 'all', filter by year only
      filteredBookings = allBookings.filter(b => {
        if (!b.createdAt) return false;
        const bookingDate = new Date(b.createdAt);
        return bookingDate.getFullYear() === year;
      });
    }
    
    // Filter by branch
    if (branch !== 'all') {
      filteredBookings = filteredBookings.filter(b => {
        const branchLocation = (b.branchLocation || '').toLowerCase();
        if (branch === 'santafe') {
          return branchLocation.includes('sta') && branchLocation.includes('fe') && branchLocation.includes('nueva vizcaya');
        }
        if (branch === 'latrinidad') {
          return branchLocation.includes('la trinidad') && branchLocation.includes('benguet');
        }
        if (branch === 'maddela') {
          return branchLocation.includes('maddela') && branchLocation.includes('quirino');
        }
        return false;
      });
    }
    
    // Count products by title
    const productCounts = {};
    filteredBookings.forEach(booking => {
      if (booking.products && Array.isArray(booking.products)) {
        booking.products.forEach(product => {
          const title = product.title || 'Unknown Product';
          if (!productCounts[title]) {
            productCounts[title] = { productName: title, count: 0 };
          }
          productCounts[title].count += 1;
        });
      }
    });
    
    // Convert to array and sort by count
    const result = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Return top 20
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching most availed products:', error);
    res.status(500).json({ error: 'Failed to fetch most availed products' });
  }
});

app.get('/api/bookings/pending', async (req, res) => {
  const bookings = await PendingBooking.find();
  res.json(bookings);
});
app.post('/api/bookings/pending', async (req, res) => {
  const bookingData = { ...req.body };
  
  // Validate that all products in the booking are available
  if (bookingData.products && Array.isArray(bookingData.products)) {
    const unavailableProducts = bookingData.products.filter(p => p.available === false);
    if (unavailableProducts.length > 0) {
      const productNames = unavailableProducts.map(p => p.title || 'Unknown').join(', ');
      return res.status(400).json({ 
        error: `Cannot create booking. The following products/services are unavailable: ${productNames}` 
      });
    }
  }
  
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
  try {
    const bookings = await ApprovedBooking.find();
    // Manually populate suppliers since they're in different DB
    const bookingsWithSuppliers = await Promise.all(bookings.map(async (booking) => {
      const bookingObj = booking.toObject();
      if (bookingObj.suppliers && bookingObj.suppliers.length > 0) {
        const suppliers = await Supplier.find({ _id: { $in: bookingObj.suppliers } }).select('-password');
        bookingObj.suppliers = suppliers;
      }
      return bookingObj;
    }));
    res.json(bookingsWithSuppliers);
  } catch (err) {
    console.error('Error fetching approved bookings:', err);
    res.status(500).json({ error: 'Failed to fetch approved bookings' });
  }
});
app.post('/api/bookings/approved', async (req, res) => {
  try {
    const bookingData = { ...req.body };
    console.log('📝 Approved booking POST - Full request body keys:', Object.keys(bookingData));
    console.log('📝 Reference number received:', bookingData.referenceNumber);
    console.log('📝 Status received:', bookingData.status);
    
    // Normalize field names: handle both 'subtotal' and 'subTotal'
    if (bookingData.subtotal !== undefined && bookingData.subTotal === undefined) {
      bookingData.subTotal = bookingData.subtotal;
      delete bookingData.subtotal;
    }
    
    const booking = new ApprovedBooking(bookingData);
    const savedBooking = await booking.save();
    console.log('✅ Approved booking saved - Reference number in DB:', savedBooking.referenceNumber);
    console.log('✅ Saved booking ID:', savedBooking._id);
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error('❌ Error saving approved booking:', error);
    res.status(500).json({ error: 'Failed to save approved booking' });
  }
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
  console.log('🏁 Finished booking POST - Reference number received:', bookingData.referenceNumber);
  // Normalize field names: handle both 'subtotal' and 'subTotal'
  if (bookingData.subtotal !== undefined && bookingData.subTotal === undefined) {
    bookingData.subTotal = bookingData.subtotal;
    delete bookingData.subtotal;
  }
  const booking = new FinishedBooking(bookingData);
  await booking.save();
  console.log('✅ Finished booking saved - Reference number in DB:', booking.referenceNumber);
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

// Admin endpoints for supplier approval management
app.get('/api/admin/suppliers/pending', async (req, res) => {
  try {
    const pendingSuppliers = await Supplier.find({ isApproved: false })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('Pending suppliers raw data:', pendingSuppliers.map(s => ({ 
      email: s.email, 
      eventTypes: s.eventTypes 
    })));
    
    // Manually populate eventTypes and categories to handle older records without these fields
    for (let supplier of pendingSuppliers) {
      if (supplier.eventTypes && supplier.eventTypes.length > 0) {
        const EventType = require('./models/EventType');
        const populated = await EventType.find({ _id: { $in: supplier.eventTypes } }).select('name');
        console.log(`Populated event types for ${supplier.email}:`, populated);
        supplier.eventTypes = populated;
      } else {
        supplier.eventTypes = [];
      }
      if (supplier.categories && supplier.categories.length > 0) {
        const Category = require('./models/Category');
        supplier.categories = await Category.find({ _id: { $in: supplier.categories } }).select('title');
      } else {
        supplier.categories = [];
      }
    }
    
    console.log('Sending pending suppliers with populated eventTypes');
    res.json(pendingSuppliers);
  } catch (error) {
    console.error('Error fetching pending suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch pending suppliers' });
  }
});

app.get('/api/admin/suppliers/approved', async (req, res) => {
  try {
    const approvedSuppliers = await Supplier.find({ isApproved: true })
      .sort({ approvedAt: -1 })
      .lean();
    
    console.log('Approved suppliers availability status:', approvedSuppliers.map(s => ({ 
      email: s.email, 
      isAvailable: s.isAvailable 
    })));
    
    // Manually populate eventTypes and categories to handle older records without these fields
    for (let supplier of approvedSuppliers) {
      if (supplier.eventTypes && supplier.eventTypes.length > 0) {
        const EventType = require('./models/EventType');
        supplier.eventTypes = await EventType.find({ _id: { $in: supplier.eventTypes } }).select('name');
      } else {
        supplier.eventTypes = [];
      }
      if (supplier.categories && supplier.categories.length > 0) {
        const Category = require('./models/Category');
        supplier.categories = await Category.find({ _id: { $in: supplier.categories } }).select('title');
      } else {
        supplier.categories = [];
      }
    }
    
    res.json(approvedSuppliers);
  } catch (error) {
    console.error('Error fetching approved suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch approved suppliers' });
  }
});

app.post('/api/admin/suppliers/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminEmail } = req.body;
    
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: adminEmail || 'admin'
      },
      { new: true }
    ).select('-password');

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Send approval email
    const { sendSupplierApprovedEmail } = require('./services/emailService');
    try {
      await sendSupplierApprovedEmail(
        supplier.email, 
        supplier.firstName, 
        supplier.lastName, 
        supplier.companyName
      );
      console.log('Approval email sent to:', supplier.email);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail approval if email fails
    }

    res.json({ 
      message: 'Supplier approved successfully', 
      supplier: supplier 
    });
  } catch (error) {
    console.error('Error approving supplier:', error);
    res.status(500).json({ error: 'Failed to approve supplier' });
  }
});

app.delete('/api/admin/suppliers/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Send rejection email before deleting
    const { sendSupplierRejectedEmail } = require('./services/emailService');
    try {
      await sendSupplierRejectedEmail(
        supplier.email, 
        supplier.firstName, 
        supplier.lastName, 
        supplier.companyName
      );
      console.log('Rejection email sent to:', supplier.email);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail rejection if email fails
    }

    // Now delete the supplier
    await Supplier.findByIdAndDelete(id);

    res.json({ message: 'Supplier rejected and removed successfully' });
  } catch (error) {
    console.error('Error rejecting supplier:', error);
    res.status(500).json({ error: 'Failed to reject supplier' });
  }
});

// Update supplier details
app.put('/api/admin/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, middleName, email, phone, companyName, eventTypes, categories, branchContacts } = req.body;
    
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Update supplier fields
    supplier.firstName = firstName;
    supplier.lastName = lastName;
    supplier.middleName = middleName;
    supplier.email = email;
    supplier.phone = phone;
    supplier.contact = phone;
    supplier.companyName = companyName;
    supplier.eventTypes = eventTypes;
    supplier.categories = categories || [];
    supplier.branchContacts = branchContacts;

    await supplier.save();

    res.json({ message: 'Supplier updated successfully', supplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier permanently
app.delete('/api/admin/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// Update customer details
app.put('/api/admin/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, middleName, email, phone, province, city, barangay } = req.body;
    
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update customer fields
    customer.firstName = firstName;
    customer.lastName = lastName;
    customer.middleName = middleName;
    customer.email = email;
    customer.phone = phone;
    customer.province = province;
    customer.city = city;
    customer.barangay = barangay;

    await customer.save();

    res.json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer permanently
app.delete('/api/admin/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Notify supplier - creates a schedule entry
app.post('/api/admin/suppliers/:id/notify', async (req, res) => {
  try {
    const { id } = req.params;
    const { eventType, description, date, location, time } = req.body;

    // Validate required fields
    if (!eventType || !date || !location) {
      return res.status(400).json({ error: 'Event type, date, and location are required' });
    }

    // Find the supplier
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Get branch location from supplier's branchContacts (use first one if multiple)
    const branchLocation = supplier.branchContacts && supplier.branchContacts.length > 0
      ? supplier.branchContacts[0]
      : null;

    // Create a schedule entry in the scheduleCalendar database
    const schedule = new Schedule({
      title: `${eventType}${supplier.companyName ? ' - ' + supplier.companyName : ''}`,
      type: 'Supplier', // Set type to 'Supplier' so it appears in supplier notifications
      person: supplier.email, // Use email so filtering works correctly
      date: date,
      location: location,
      description: `${description || ''}${time ? '\nTime: ' + time : ''}`,
      supplierId: supplier.email,
      supplierName: `${supplier.firstName} ${supplier.lastName}`,
      eventType: eventType, // Store the actual event type separately
      branchLocation: branchLocation,
      status: 'pending' // Initial status is pending
    });

    await schedule.save();

    // Optional: Send email notification to supplier
    const { sendSupplierNotificationEmail } = require('./services/emailService');
    try {
      await sendSupplierNotificationEmail(
        supplier.email,
        supplier.firstName,
        supplier.lastName,
        eventType,
        date,
        location,
        time,
        description
      );
      console.log('Notification email sent to:', supplier.email);
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail if email fails - schedule is already saved
    }

    res.json({ 
      message: 'Notification sent and schedule created successfully',
      schedule: schedule
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});


app.get('/api/suppliers', async (req, res) => {
  try {
    // Only return approved suppliers for dashboard counts
    const suppliers = await Supplier.find({ isApproved: true });
    console.log('Found approved suppliers:', suppliers.length);
    res.json(suppliers);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get most active suppliers based on accepted schedules
app.get('/api/suppliers/most-active', async (req, res) => {
  try {
    const { filter, year, branch } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();
    const branchFilter = branch || 'all';
    
    // Build date filter
    let dateFilter = {};
    if (filter === 'all') {
      // All months in the selected year
      dateFilter = {
        date: {
          $gte: new Date(selectedYear, 0, 1).toISOString(),
          $lte: new Date(selectedYear, 11, 31, 23, 59, 59).toISOString()
        }
      };
    } else if (filter !== undefined && filter !== null) {
      // Specific month (0-11)
      const month = parseInt(filter);
      const startDate = new Date(selectedYear, month, 1);
      const endDate = new Date(selectedYear, month + 1, 0, 23, 59, 59);
      dateFilter = {
        date: {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString()
        }
      };
    }

    // Aggregate accepted schedules by supplier
    let acceptedSchedules = await SupplierAccepted.find(dateFilter);
    
    // Filter by branch if specified
    if (branchFilter !== 'all') {
      acceptedSchedules = acceptedSchedules.filter(schedule => {
        const branchLocation = (schedule.branchLocation || '').toLowerCase();
        if (branchFilter === 'santafe') {
          return branchLocation.includes('sta') && branchLocation.includes('fe') && branchLocation.includes('nueva vizcaya');
        }
        if (branchFilter === 'latrinidad') {
          return branchLocation.includes('la trinidad') && branchLocation.includes('benguet');
        }
        if (branchFilter === 'maddela') {
          return branchLocation.includes('maddela') && branchLocation.includes('quirino');
        }
        return false;
      });
    }
    
    // Count schedules per supplier
    const supplierCounts = {};
    acceptedSchedules.forEach(schedule => {
      const supplierId = schedule.supplierId || schedule.person;
      const supplierName = schedule.supplierName || 'Unknown Supplier';
      
      if (supplierId) {
        if (!supplierCounts[supplierId]) {
          supplierCounts[supplierId] = {
            supplierId,
            supplierName,
            supplierEmail: supplierId,
            supplierPhone: '',
            count: 0
          };
        }
        supplierCounts[supplierId].count++;
      }
    });

    // Fetch supplier details for phone numbers and branch contacts
    const supplierIds = Object.keys(supplierCounts);
    const suppliers = await Supplier.find({ email: { $in: supplierIds } });
    
    suppliers.forEach(supplier => {
      if (supplierCounts[supplier.email]) {
        supplierCounts[supplier.email].supplierPhone = supplier.phone || '';
        supplierCounts[supplier.email].supplierName = supplier.companyName || supplierCounts[supplier.email].supplierName;
        supplierCounts[supplier.email].branchContacts = supplier.branchContacts || [];
      }
    });

    // Filter suppliers by their branchContacts if branch filter is specified
    let filteredSupplierCounts = Object.values(supplierCounts);
    if (branchFilter !== 'all') {
      filteredSupplierCounts = filteredSupplierCounts.filter(supplierCount => {
        const branchContacts = supplierCount.branchContacts || [];
        // Check if any of the supplier's branchContacts matches the selected branch
        return branchContacts.some(contact => {
          const contactLower = (contact || '').toLowerCase();
          if (branchFilter === 'santafe') {
            return contactLower.includes('sta') && contactLower.includes('fe');
          }
          if (branchFilter === 'latrinidad') {
            return contactLower.includes('la trinidad');
          }
          if (branchFilter === 'maddela') {
            return contactLower.includes('maddela');
          }
          return false;
        });
      });
    }

    // Sort by count
    const result = filteredSupplierCounts.sort((a, b) => b.count - a.count);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching most active suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch most active suppliers' });
  }
});

// Update supplier availability status
app.put('/api/suppliers/availability', async (req, res) => {
  try {
    const { email, isAvailable } = req.body;
    
    console.log('Updating availability for:', email, 'to:', isAvailable);
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const supplier = await Supplier.findOneAndUpdate(
      { email },
      { isAvailable },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    console.log('Updated supplier:', { email: supplier.email, isAvailable: supplier.isAvailable });

    res.json({ 
      message: 'Availability status updated successfully',
      isAvailable: supplier.isAvailable
    });
  } catch (error) {
    console.error('Error updating supplier availability:', error);
    res.status(500).json({ error: 'Failed to update availability status' });
  }
});

app.post('/api/auth/register-supplier', async (req, res) => {
  try {
    console.log('Supplier registration request:', req.body);
    console.log('branchContacts received:', req.body.branchContacts);
    
    const { email, password, companyName, firstName, lastName, middleName, phone, eventTypes, categories, branchContacts } = req.body;
    
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
      mfaEnabled: false,
      isApproved: false,  // New suppliers need admin approval
      eventTypes: eventTypes || [],  // Save selected event types
      categories: categories || [],  // Save selected categories
      branchContacts: branchContacts || []  // Save selected branch locations
    });
    
    console.log('Attempting to save supplier:', {
      email: supplier.email,
      companyName: supplier.companyName,
      phone: supplier.phone,
      branchContacts: supplier.branchContacts
    });

    await supplier.save();
    
    console.log('Supplier registered successfully:', {
      id: supplier._id,
      email: supplier.email,
      isApproved: supplier.isApproved
    });

    // Send pending approval email
    const { sendSupplierPendingEmail } = require('./services/emailService');
    try {
      await sendSupplierPendingEmail(email, firstName, lastName, companyName);
      console.log('Pending approval email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send pending email:', emailError);
      // Don't fail registration if email fails
    }
    
    res.status(201).json({ 
      message: 'Registration successful! Your account is pending admin approval. Please check your email for confirmation.', 
      requiresApproval: true,
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
    console.log('Customer registration request:', req.body);
    const { email, password, firstName, lastName, middleName, phone, province, city, barangay } = req.body;
    console.log('Location data received:', { province, city, barangay });
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Customer already exists' });
    }
   
    const customer = new Customer({ 
      email, 
      password, 
      firstName, 
      lastName, 
      middleName, 
      phone, 
      contact: phone,
      phoneNumber: phone,
      province,
      city,
      barangay
    });
    
    console.log('Attempting to save customer:', {
      email: customer.email,
      phone: customer.phone,
      province: customer.province,
      city: customer.city,
      barangay: customer.barangay
    });
    
    await customer.save();
    
    console.log('Customer registered successfully:', {
      id: customer._id,
      email: customer.email,
      location: { province: customer.province, city: customer.city, barangay: customer.barangay }
    });
    
    res.status(201).json({ message: 'Customer registered successfully', user: customer });
  } catch (err) {
    console.error('Customer registration error:', err);
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
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const branch = req.query.branch || 'all';
    const now = new Date();
    let startDate;
    let endDate;

    // Determine start date based on filter - handle 'all' and month numbers
    if (filter === 'all') {
      // For 'all months', get the entire year
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else if (!isNaN(filter) && parseInt(filter) >= 0 && parseInt(filter) < 12) {
      // If filter is a month number (0-11), get that specific month in the selected year
      startDate = new Date(year, parseInt(filter), 1);
      endDate = new Date(year, parseInt(filter) + 1, 0, 23, 59, 59);
    } else {
      // Handle string filters like 'thisWeek', 'thisMonth', etc.
      switch (filter) {
        case 'thisWeek':
          const day = now.getDay();
          const diff = now.getDate() - day;
          startDate = new Date(year, now.getMonth(), diff);
          endDate = new Date(year, now.getMonth(), diff + 6, 23, 59, 59);
          break;
        case 'thisMonth':
          startDate = new Date(year, now.getMonth(), 1);
          endDate = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'this6Months':
          startDate = new Date(year, now.getMonth() - 5, 1);
          endDate = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'thisYear':
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31, 23, 59, 59);
          break;
        default:
          startDate = new Date(year, now.getMonth(), 1);
          endDate = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);
      }
    }

    // Build query with optional branch filter
    const dateQuery = { date: { $gte: startDate, $lte: endDate } };
    
    // Get all relevant bookings for the selected year
    const [finishedBookings, approvedBookings] = await Promise.all([
      FinishedBooking.find(dateQuery),
      ApprovedBooking.find(dateQuery)
    ]);

    // Combine and process bookings
    let allBookings = [...finishedBookings, ...approvedBookings];
    
    // Filter by branch if specified
    if (branch !== 'all') {
      allBookings = allBookings.filter(booking => {
        const branchLocation = (booking.branchLocation || '').toLowerCase();
        if (branch === 'santafe') {
          return branchLocation.includes('sta') && branchLocation.includes('fe') && branchLocation.includes('nueva vizcaya');
        } else if (branch === 'latrinidad') {
          return branchLocation.includes('la trinidad') && branchLocation.includes('benguet');
        } else if (branch === 'maddela') {
          return branchLocation.includes('maddela') && branchLocation.includes('quirino');
        }
        return false;
      });
    }
    
    console.log('Revenue calculation - Found bookings:', {
      finished: finishedBookings.length,
      approved: approvedBookings.length,
      total: allBookings.length,
      branch: branch
    });
    
    // Initialize array for all months
    const revenueData = Array(12).fill(0).map((_, i) => ({
      month: i,
      value: 0
    }));

    // Calculate revenue for each month
    allBookings.forEach(booking => {
      // Use booking.date (event date) instead of createdAt for proper month categorization
      const bookingDate = booking.date ? new Date(booking.date) : null;
      
      // Check totalPrice or subTotal (fallback to subTotal if totalPrice is 0 or missing)
      const revenue = booking.totalPrice || booking.subTotal || 0;
      
      if (revenue > 0 && bookingDate && bookingDate.getFullYear() === year) {
        const month = bookingDate.getMonth();
        revenueData[month].value += revenue;
        console.log(`Adding ₱${revenue} to month ${month} for year ${year} (${bookingDate.toDateString()})`);
      } else {
        console.log('Skipping booking - missing data or wrong year:', {
          hasTotalPrice: !!booking.totalPrice,
          hasSubTotal: !!booking.subTotal,
          revenue: revenue,
          hasDate: !!booking.date,
          bookingYear: bookingDate?.getFullYear(),
          targetYear: year,
          totalPrice: booking.totalPrice,
          subTotal: booking.subTotal,
          date: booking.date
        });
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
  mongoose.connect(`${process.env.MONGODB_URI}/ProductsAndServices`, { useNewUrlParser: true, useUnifiedTopology: true }),
  authConnection.asPromise(),
  scheduleConnection.asPromise(),
  bgImageConnection.asPromise(),
  bookingConnection.asPromise(),
  promoConnection.asPromise()
]).then(() => {
  console.log('All MongoDB connections established');
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

// Register eventTypes route so frontend can fetch and update event types from the database.
const eventTypesRouter = require('./routes/eventTypes');
app.use('/api/event-types', eventTypesRouter);
