const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    contact: { type: String },
    password: { type: String, required: true },
    role: { type: String, default: 'supplier' },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null },
    businessName: { type: String },
    businessAddress: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);