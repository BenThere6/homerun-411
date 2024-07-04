const express = require('express');
const router = express.Router();
const AppFeedback = require('../../models/AppFeedback');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');

// Middleware function to fetch app feedback by ID
async function getAppFeedback(req, res, next) {
  let feedback;
  try {
    feedback = await AppFeedback.findById(req.params.id);
    if (feedback == null) {
      return res.status(404).json({ message: 'App feedback not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.feedback = feedback;
  next();
}

// Create app feedback
router.post('/', auth, async (req, res) => {
  try {
    const { content, rating, ideasForImprovement } = req.body;
    const newFeedback = new AppFeedback({
      user: req.user.id,
      content,
      rating,
      ideasForImprovement,
    });
    const savedFeedback = await newFeedback.save();
    res.status(201).json(savedFeedback);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all app feedback (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const feedback = await AppFeedback.find();
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get app feedback by ID
router.get('/:id', auth, getAppFeedback, (req, res) => {
  res.json(res.feedback);
});

// Update app feedback by ID
router.patch('/:id', auth, getAppFeedback, async (req, res) => {
  try {
    if (req.body.content != null) {
      res.feedback.content = req.body.content;
    }
    if (req.body.rating != null) {
      res.feedback.rating = req.body.rating;
    }
    if (req.body.ideasForImprovement != null) {
      res.feedback.ideasForImprovement = req.body.ideasForImprovement;
    }
    const updatedFeedback = await res.feedback.save();
    res.json(updatedFeedback);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete app feedback by ID
router.delete('/:id', auth, isAdmin, getAppFeedback, async (req, res) => {
  try {
    await res.feedback.remove();
    res.json({ message: 'App feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;