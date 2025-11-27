const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const GallerySchema = require('../models/GallerySchema');

// Create a separate connection for goldustGallery database
const galleryConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/goldustGallery', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
galleryConnection.on('connected', () => console.log('MongoDB goldustGallery connected!'));
galleryConnection.on('error', err => console.error('MongoDB goldustGallery connection error:', err));

const Gallery = galleryConnection.model('Gallery', GallerySchema);

const router = express.Router();


// POST /api/gallery/upload (base64)
router.post('/upload', async (req, res) => {
  try {
    const { image, name } = req.body;
    if (!image || !name) return res.status(400).json({ error: 'No image data or name provided' });
    const newImage = new Gallery({ url: image, name });
    await newImage.save();
    res.status(201).json(newImage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// GET /api/gallery
router.get('/', async (req, res) => {
  try {
    const images = await Gallery.find({});
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// DELETE /api/gallery/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Gallery.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Image not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
