const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');

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
router.post('/subscriptions', async (req, res) => {
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
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific subscription by ID
router.get('/subscriptions/:id', getSubscription, (req, res) => {
  res.json(res.subscription);
});

// Update a specific subscription by ID
router.patch('/subscriptions/:id', getSubscription, async (req, res) => {
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
router.delete('/subscriptions/:id', getSubscription, async (req, res) => {
  try {
    await res.subscription.remove();
    res.json({ message: 'Deleted subscription' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;