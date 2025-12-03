const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    phoneNumber: { type: String },
    contact: { type: String },
    password: { type: String, required: true },
    role: { type: String, default: 'supplier' },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null },
    companyName: { type: String },
    businessName: { type: String },
    businessAddress: { type: String },
    isApproved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    approvedBy: { type: String },
    eventTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventType' }],
    branchContacts: [{ type: String }],
    isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);