const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    contact: { type: String },
    password: { type: String, required: true },
    role: { type: String, default: 'customer' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);