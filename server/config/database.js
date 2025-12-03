const mongoose = require('mongoose');

// Create authentication connection
const authConnection = mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/authentication', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define schemas
const customerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    middleName: String,
    phone: String,
    contact: String,
    mfaEnabled: { type: Boolean, required: true, default: false },
    province: { type: String },
    city: { type: String },
    barangay: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Define EventType schema in auth connection
const eventTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
});

const supplierSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    companyName: String,
    firstName: String,
    lastName: String,
    middleName: String,
    phone: String,
    contact: String,
    mfaEnabled: { type: Boolean, required: true, default: false },
    isApproved: { type: Boolean, default: false },
    approvedAt: Date,
    approvedBy: String,
    eventTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventType' }],
    branchContacts: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Create models on the auth connection
const Customer = authConnection.model('Customer', customerSchema);
const Supplier = authConnection.model('Supplier', supplierSchema);
const EventType = authConnection.model('EventType', eventTypeSchema);

module.exports = {
    authConnection,
    Customer,
    Supplier,
    EventType
};