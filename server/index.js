
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const { sendOTP } = require('./services/emailService');
const otpStore = {};

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const reviewsRouter = require('./routes/reviews');
app.use('/api/reviews', reviewsRouter);



// Create a separate connection for schedules/calendar
const scheduleConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/scheduleCalendar', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
scheduleConnection.on('connected', () => console.log('MongoDB scheduleCalendar connected!'));
scheduleConnection.on('error', err => console.error('MongoDB scheduleCalendar connection error:', err));

// Load Schedule model using the new connection
const scheduleSchema = require('./models/Schedule').schema;
const Schedule = scheduleConnection.model('Schedule', scheduleSchema);
const { SupplierAcceptedSchedule, SupplierDeclinedSchedule } = require('./models/SupplierSchedule');

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

// DELETE endpoint for schedules
app.delete('/api/schedules/:id', async (req, res) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ success: true });
  } catch (err) {
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


const authConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/authentication', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
authConnection.on('connected', () => console.log('MongoDB authentication connected!'));
authConnection.on('error', err => console.error('MongoDB authentication connection error:', err));


const supplierSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: String,
  firstName: String,
  lastName: String,
  middleName: String,
  phone: String,
  contact: String,
  createdAt: { type: Date, default: Date.now }
});
const Supplier = authConnection.model('Supplier', supplierSchema);


const customerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  middleName: String,
  phone: String,
  contact: String,
  createdAt: { type: Date, default: Date.now }
});
const Customer = authConnection.model('Customer', customerSchema);


app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });


  const user = await Customer.findOne({ email }) || await Supplier.findOne({ email });
  if (!user) return res.status(404).json({ error: 'No account with that email' });

  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 min expiry

  const sent = await sendOTP(email, otp);
  if (!sent) return res.status(500).json({ error: 'Failed to send email' });
  res.json({ message: 'OTP sent' });
});


app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Missing email or otp' });
  const record = otpStore[email];
  if (!record || record.otp !== otp) return res.status(400).json({ error: 'Invalid code' });
  if (Date.now() > record.expires) return res.status(400).json({ error: 'Code expired' });
  res.json({ message: 'OTP verified' });
});


app.post('/api/auth/reset-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
 
  const record = otpStore[email];
  if (!record) return res.status(400).json({ error: 'OTP not requested' });
  if (Date.now() > record.expires) return res.status(400).json({ error: 'OTP expired' });


  let user = await Customer.findOne({ email });
  if (user) {
    user.password = password;
    await user.save();
    delete otpStore[email];
    return res.json({ message: 'Password reset successful' });
  }
  user = await Supplier.findOne({ email });
  if (user) {
    user.password = password;
    await user.save();
    delete otpStore[email];
    return res.json({ message: 'Password reset successful' });
  }
  res.status(404).json({ error: 'User not found' });
});


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
const PORT = 5051;


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.post('/api/auth/login-supplier', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    const supplier = await Supplier.findOne({ email });
    if (!supplier || supplier.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', user: supplier });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/auth/login-customer', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    const customer = await Customer.findOne({ email });
    if (!customer || customer.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', user: customer });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



const MONGO_URI = 'mongodb://127.0.0.1:27017/ProductsAndServices';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB ProductsAndServices connected!'))
  .catch(err => console.error('MongoDB ProductsAndServices connection error:', err));


const bgImageConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/backgroundImages', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
bgImageConnection.on('connected', () => console.log('MongoDB backgroundImages connected!'));
bgImageConnection.on('error', err => console.error('MongoDB backgroundImages connection error:', err));


const bookingConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
bookingConnection.on('connected', () => console.log('MongoDB booking connected!'));
bookingConnection.on('error', err => console.error('MongoDB booking connection error:', err));




const categorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: String,
  fields: [{ label: String }],
});
const Category = mongoose.model('Category', categorySchema);


const productSchema = new mongoose.Schema({
  image: String,
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
  totalPrice: Number,
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
  const booking = new PendingBooking(req.body);
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
  const booking = new ApprovedBooking(req.body);
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
  const booking = new FinishedBooking(req.body);
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
  const products = await Product.find({ categoryTitle: req.params.categoryTitle });
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const prod = new Product(req.body);
  await prod.save();
  res.status(201).json(prod);
});

app.put('/api/products/:id', async (req, res) => {
  const prod = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(prod);
});

app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});




app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register-supplier', async (req, res) => {
  try {
    const { email, password, companyName, firstName, lastName, middleName, phone } = req.body;
    if (!email || !password || !companyName || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
 
    const existing = await Supplier.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Supplier already exists' });
    }
  
    const supplier = new Supplier({ email, password, companyName, firstName, lastName, middleName, phone, contact: phone });
    await supplier.save();
    res.status(201).json({ message: 'Supplier registered successfully', user: supplier });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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
  mongoose.connect('mongodb://127.0.0.1:27017/ProductsAndServices', { useNewUrlParser: true, useUnifiedTopology: true }),
  authConnection.asPromise(),
  scheduleConnection.asPromise(),
  bgImageConnection.asPromise(),
  bookingConnection.asPromise()
]).then(() => {
  console.log('All MongoDB connections established');
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});
