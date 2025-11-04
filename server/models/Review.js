const mongoose = require('mongoose');

// Create a separate connection for the reviews database
const reviewsConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/reviews', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: String, required: true },
  source: { type: String, default: 'Customer' },
  logo: { type: String, default: null },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = reviewsConnection.model('Review', reviewSchema, 'reviews');
