const mongoose = require('mongoose');

// Create authentication connection
const authConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/authentication', {
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