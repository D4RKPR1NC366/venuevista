const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    phoneNumber: { type: String },
    contact: { type: String },
    password: { type: String, required: true },
    role: { type: String, default: 'customer' },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null },
    province: { type: String },
    city: { type: String },
    barangay: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);