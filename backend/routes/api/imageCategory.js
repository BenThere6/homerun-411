const express = require('express');
const router = express.Router();
const ImageCategory = require('../../models/ImageCategory');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await ImageCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new category (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const existing = await ImageCategory.findOne({ name });
    if (existing) return res.status(409).json({ message: 'Category already exists' });

    const category = new ImageCategory({ name });
    const saved = await category.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
