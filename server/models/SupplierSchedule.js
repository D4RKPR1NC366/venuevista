const mongoose = require('mongoose');

const supplierScheduleBaseSchema = new mongoose.Schema({
    bookingId: { type: String },
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
    actionDate: { type: Date, default: Date.now },
    cancellationRequest: {
        status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
        reason: { type: String },
        description: { type: String },
        requestedBy: { type: String },
        requestedAt: { type: Date },
        processedBy: { type: String },
        processedAt: { type: Date },
        adminNotes: { type: String }
    }
});

const upcomingScheduleSchema = new mongoose.Schema({
    bookingId: { type: String, required: true },
    eventType: { type: String, required: true },
    eventDate: { type: String, required: true },
    branch: { type: String },
    venue: { type: String },
    supplierId: { type: String, required: true },
    supplierName: { type: String, required: true },
    scheduledTime: { type: String, required: true },
    arriveEarly: { type: Boolean, default: false },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const SupplierAcceptedSchedule = mongoose.model('SupplierAcceptedSchedule', supplierScheduleBaseSchema);
const SupplierDeclinedSchedule = mongoose.model('SupplierDeclinedSchedule', supplierScheduleBaseSchema);
const SupplierUpcomingSchedule = mongoose.model('SupplierUpcomingSchedule', upcomingScheduleSchema);

module.exports = {
    SupplierAcceptedSchedule,
    SupplierDeclinedSchedule,
    SupplierUpcomingSchedule
};