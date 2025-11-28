const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, rating, comment, date, source, logo, bookingId, userId, images } = req.body;
    
    const review = new Review({ 
      name, 
      rating, 
      comment, 
      date, 
      source, 
      logo, 
      images: images || [],
      bookingId, 
      userId 
    });
    
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(400).json({ error: 'Failed to add review' });
  }
});

module.exports = router;
