const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add a new review
router.post('/', async (req, res) => {
  try {
    const { name, rating, comment, date, source, logo, bookingId, userId } = req.body;
    const review = new Review({ name, rating, comment, date, source, logo, bookingId, userId });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add review' });
  }
});

module.exports = router;
