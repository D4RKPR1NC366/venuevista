const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = GallerySchema;
