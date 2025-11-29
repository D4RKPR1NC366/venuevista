const mongoose = require('mongoose');

// Atlas connection configuration
const ATLAS_URI = 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/';

// Create Atlas connections for different databases
const atlasAuthConnection = mongoose.createConnection(`${ATLAS_URI}authentication`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

const atlasBookingConnection = mongoose.createConnection(`${ATLAS_URI}booking`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

const atlasReviewsConnection = mongoose.createConnection(`${ATLAS_URI}reviews`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

// Atlas schemas (matching local schemas)
const atlasCustomerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    middleName: String,
    phone: String,
    contact: String,
    mfaEnabled: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, default: Date.now },
    lastBackupSync: { type: Date, default: Date.now }
});

const atlasSupplierSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    companyName: String,
    firstName: String,
    lastName: String,
    middleName: String,
    phone: String,
    contact: String,
    mfaEnabled: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, default: Date.now },
    lastBackupSync: { type: Date, default: Date.now }
});

const atlasBookingSchema = new mongoose.Schema({
    userId: String,
    name: String,
    contact: String,
    email: String,
    eventType: String,
    date: Date,
    eventVenue: String,
    guestCount: Number,
    paymentMode: String,
    discountType: String,
    discount: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
    promoDiscount: { type: Number, default: 0 },
    totalPrice: Number,
    paymentDetails: {
        paymentStatus: String,
        amountPaid: Number,
        paymentDate: String,
        transactionReference: String,
        paymentProof: String,
        paymentNotes: String
    },
    products: [{
        image: String,
        title: String,
        price: Number,
        additionals: { type: [Object], default: [] }
    }],
    specialRequest: String,
    service: String,
    details: Object,
    outsidePH: String,
    contractPicture: String,
    bookingStatus: { 
        type: String, 
        enum: ['pending', 'approved', 'finished'], 
        required: true 
    },
    createdAt: { type: Date, default: Date.now },
    lastBackupSync: { type: Date, default: Date.now }
});

const atlasReviewSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    supplierEmail: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true },
    images: [String],
    createdAt: { type: Date, default: Date.now },
    lastBackupSync: { type: Date, default: Date.now }
});

// Create Atlas models
const AtlasCustomer = atlasAuthConnection.model('Customer', atlasCustomerSchema);
const AtlasSupplier = atlasAuthConnection.model('Supplier', atlasSupplierSchema);
const AtlasBooking = atlasBookingConnection.model('Booking', atlasBookingSchema);
const AtlasReview = atlasReviewsConnection.model('Review', atlasReviewSchema);

module.exports = {
    atlasAuthConnection,
    atlasBookingConnection,
    atlasReviewsConnection,
    AtlasCustomer,
    AtlasSupplier,
    AtlasBooking,
    AtlasReview,
    ATLAS_URI
};