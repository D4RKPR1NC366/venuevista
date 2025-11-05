const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
	title: { type: String, required: true },
	type: { type: String, required: true },
	person: { type: String, required: true },
	date: { type: String, required: true },
	location: { type: String, required: true },
	description: { type: String },
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
