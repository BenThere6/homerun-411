const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth'); // Import the auth middleware
const isAdmin = require('../middleware/isAdmin');

// Middleware function to fetch a subscription by ID
async function getSubscription(req, res, next) {
  let subscription;
  try {
    subscription = await Subscription.findById(req.params.id);
    if (subscription == null) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.subscription = subscription;
  next();
}

// Create a new subscription
router.post('/subscriptions', auth, async (req, res) => { // Apply auth middleware
  try {
    const { user, startDate, endDate } = req.body;

    const newSubscription = new Subscription({
      user,
      startDate,
      endDate,
    });

    const savedSubscription = await newSubscription.save();
    res.status(201).json(savedSubscription);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all subscriptions
router.get('/subscriptions', isAdmin, async (req, res) => { // Apply auth middleware
  try {
    const subscriptions = await Subscription.find();
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific subscription by ID
router.get('/subscriptions/:id', auth, getSubscription, (req, res) => { // Apply auth middleware
  res.json(res.subscription);
});

// Update a specific subscription by ID
router.patch('/subscriptions/:id', auth, getSubscription, async (req, res) => { // Apply auth middleware
  if (req.body.startDate != null) {
    res.subscription.startDate = req.body.startDate;
  }
  if (req.body.endDate != null) {
    res.subscription.endDate = req.body.endDate;
  }

  try {
    const updatedSubscription = await res.subscription.save();
    res.json(updatedSubscription);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific subscription by ID
router.delete('/subscriptions/:id', isAdmin, getSubscription, async (req, res) => { // Apply auth middleware
  try {
    await res.subscription.remove();
    res.json({ message: 'Deleted subscription' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;