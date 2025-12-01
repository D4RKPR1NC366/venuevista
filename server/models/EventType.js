const mongoose = require('mongoose');

const EventTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
});

module.exports = mongoose.model('EventType', EventTypeSchema);