const express = require('express');
const router = express.Router();
const Category = require('../../models/Category');
const auth = require('../../middleware/auth');

// Middleware function to fetch a category by ID
async function getCategory(req, res, next) {
  let category;
  try {
    category = await Category.findById(req.params.id);
    if (category == null) {
      return res.status(404).json({ message: 'Category not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.category = category;
  next();
}

// Create a new category
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = new Category({ name, description });
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific category by ID
router.get('/:id', getCategory, (req, res) => {
  res.json(res.category);
});

// Update a specific category by ID
router.patch('/:id', auth, getCategory, async (req, res) => {
  if (req.body.name != null) {
    res.category.name = req.body.name;
  }
  if (req.body.description != null) {
    res.category.description = req.body.description;
  }
  res.category.updatedAt = Date.now();

  try {
    const updatedCategory = await res.category.save();
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific category by ID
router.delete('/:id', auth, getCategory, async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully', deletedCategory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;