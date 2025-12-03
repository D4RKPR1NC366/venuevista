const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  clientEmail: { type: String, required: true },
  clientName: { type: String, required: true },
  date: { type: String, required: true }, // ISO date string
  description: { type: String },
  location: { type: String },
  branchLocation: { type: String }, // Branch from booking
  status: { type: String, default: 'upcoming' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
