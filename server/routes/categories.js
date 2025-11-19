const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Add a new category
router.post('/', async (req, res) => {
  try {
    const { title, image, fields, events } = req.body;
    const category = new Category({ title, image, fields, events });
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add category' });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const { title, image, fields, events } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { title, image, fields, events },
      { new: true }
    );
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update category' });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
