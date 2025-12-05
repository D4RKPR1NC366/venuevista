const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
	title: { type: String, required: true },
	type: { type: String, required: true },
	person: { type: String, required: true },
	date: { type: String, required: true },
	location: { type: String },
	description: { type: String },
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
