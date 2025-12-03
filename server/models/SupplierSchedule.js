const mongoose = require('mongoose');

const supplierScheduleBaseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, required: true },
    person: { type: String, required: true },
    date: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    supplierId: { type: String, required: true },
    supplierName: { type: String, required: true },
    eventType: { type: String },
    branchLocation: { type: String },
    status: { type: String, enum: ['accepted', 'declined'], required: true },
    createdAt: { type: Date, default: Date.now },
    actionDate: { type: Date, default: Date.now }
});

const SupplierAcceptedSchedule = mongoose.model('SupplierAcceptedSchedule', supplierScheduleBaseSchema);
const SupplierDeclinedSchedule = mongoose.model('SupplierDeclinedSchedule', supplierScheduleBaseSchema);

module.exports = {
    SupplierAcceptedSchedule,
    SupplierDeclinedSchedule
};