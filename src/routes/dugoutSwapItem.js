const express = require('express');
const router = express.Router();
const DugoutSwapItem = require('../models/DugoutSwapItem');
const auth = require('../middleware/auth');

// Middleware function to fetch a dugout swap item by ID
async function getDugoutSwapItem(req, res, next) {
  let item;
  try {
    item = await DugoutSwapItem.findById(req.params.id);
    if (item == null) {
      return res.status(404).json({ message: 'Dugout swap item not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.item = item;
  next();
}

// Create a new dugout swap item
router.post('/dugoutswapitems', auth, async (req, res) => {
  try {
    const { name, description, price, condition, imageURL, seller, category, zipCode } = req.body;
    const newItem = new DugoutSwapItem({
      name,
      description,
      price,
      condition,
      imageURL,
      seller,
      category,
      zipCode,
    });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all dugout swap items
router.get('/dugoutswapitems', auth, async (req, res) => {
  try {
    const items = await DugoutSwapItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific dugout swap item by ID
router.get('/dugoutswapitems/:id', auth, getDugoutSwapItem, (req, res) => {
  res.json(res.item);
});

// Update a specific dugout swap item by ID
router.patch('/dugoutswapitems/:id', auth, getDugoutSwapItem, async (req, res) => {
  if (req.body.name != null) {
    res.item.name = req.body.name;
  }
  if (req.body.description != null) {
    res.item.description = req.body.description;
  }
  if (req.body.price != null) {
    res.item.price = req.body.price;
  }
  if (req.body.condition != null) {
    res.item.condition = req.body.condition;
  }
  if (req.body.imageURL != null) {
    res.item.imageURL = req.body.imageURL;
  }
  if (req.body.category != null) {
    res.item.category = req.body.category;
  }
  if (req.body.zipCode != null) {
    res.item.zipCode = req.body.zipCode;
  }

  try {
    const updatedItem = await res.item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific dugout swap item by ID
router.delete('/dugoutswapitems/:id', auth, getDugoutSwapItem, async (req, res) => {
  try {
    await res.item.remove();
    res.json({ message: 'Deleted dugout swap item' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;