const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/';
const reviewsConnection = mongoose.createConnection(`${ATLAS_URI}reviews`, {
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
  images: [{ type: String }], // Array of image file paths or URLs
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = reviewsConnection.model('Review', reviewSchema, 'reviews');
