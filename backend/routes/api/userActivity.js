const express = require('express');
const router = express.Router();
const UserActivity = require('../../models/UserActivity');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');

// Create a new user activity
router.post('/', auth, async (req, res) => {
  try {
    const userActivity = new UserActivity(req.body);
    const savedActivity = await userActivity.save();
    res.status(201).json(savedActivity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all user activities
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const activities = await UserActivity.find();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user activities by user ID
router.get('/user/:userId', auth, isAdmin, async (req, res) => {
  try {
    const activities = await UserActivity.find({ userId: req.params.userId });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user activities by session ID
router.get('/session/:sessionId', auth, isAdmin, async (req, res) => {
  try {
    const activities = await UserActivity.find({ sessionId: req.params.sessionId });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user activities by date range
router.get('/date-range', auth, isAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const activities = await UserActivity.find({
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a specific user activity by ID
router.patch('/:id', auth, isAdmin, async (req, res) => {
  try {
    const updatedActivity = await UserActivity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedActivity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific user activity by ID
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await UserActivity.findByIdAndDelete(req.params.id);
    res.json({ message: 'User activity deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete all user activities by user ID
router.delete('/user/:userId', auth, isAdmin, async (req, res) => {
  try {
    await UserActivity.deleteMany({ userId: req.params.userId });
    res.json({ message: 'All user activities deleted for user' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;