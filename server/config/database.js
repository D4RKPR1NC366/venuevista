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
    createdAt: { type: Date, default: Date.now }
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
    createdAt: { type: Date, default: Date.now }
});

// Create models
const Customer = authConnection.model('Customer', customerSchema);
const Supplier = authConnection.model('Supplier', supplierSchema);

module.exports = {
    authConnection,
    Customer,
    Supplier
};