const express = require('express');
const router = express.Router();
const AmazonAffiliateItem = require('../models/AmazonAffiliateItem');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// GET all items
router.get('/', auth, async (req, res) => {
  try {
    const items = await AmazonAffiliateItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one item
router.get('/:id', auth, getAmazonAffiliateItem, (req, res) => {
  res.json(res.item);
});

// POST create an item
router.post('/', isAdmin, async (req, res) => {
  const item = new AmazonAffiliateItem({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    condition: req.body.condition || 'New', // Default to 'New' if not provided
    imageURL: req.body.imageURL,
    link: req.body.link,
    category: req.body.category,
  });

  try {
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH update an item
router.patch('/:id', isAdmin, getAmazonAffiliateItem, async (req, res) => {
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
  if (req.body.link != null) {
    res.item.link = req.body.link;
  }
  if (req.body.category != null) {
    res.item.category = req.body.category;
  }
  try {
    const updatedItem = await res.item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE an item
router.delete('/:id', isAdmin, getAmazonAffiliateItem, async (req, res) => {
  try {
    await res.item.remove();
    res.json({ message: 'Deleted item' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function to get item by ID
async function getAmazonAffiliateItem(req, res, next) {
  let item;
  try {
    item = await AmazonAffiliateItem.findById(req.params.id);
    if (item == null) {
      return res.status(404).json({ message: 'Cannot find item' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.item = item;
  next();
}

module.exports = router;