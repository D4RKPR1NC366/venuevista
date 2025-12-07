const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
	title: { type: String, required: true },
	type: { type: String, required: true },
	person: { type: String, required: true },
	date: { type: String, required: true },
	location: { type: String },
	description: { type: String },
	supplierId: { type: String },
	supplierName: { type: String },
	eventType: { type: String },
	branchLocation: { type: String },
	status: { type: String, default: 'pending' }, // pending, accepted, declined, cancelled
	cancellationRequest: {
		status: { type: String, default: 'none' }, // 'none', 'pending', 'approved', 'rejected'
		reason: { type: String },
		description: { type: String },
		requestedBy: { type: String },
		requestedAt: { type: Date },
		processedBy: { type: String },
		processedAt: { type: Date },
		adminNotes: { type: String }
	},
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
