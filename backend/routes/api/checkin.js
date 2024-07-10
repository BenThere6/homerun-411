const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Park = require('../../models/Park');
const auth = require('../../middleware/auth');

// POST: Check-in to a park
router.post('/', auth, async (req, res) => {
  try {
    const { parkId } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const park = await Park.findById(parkId);
    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }

    user.recentlyVisitedParks.push({
      park: parkId,
      date: new Date()
    });

    await user.save();
    res.status(200).json({ message: 'Check-in successful', recentlyVisitedParks: user.recentlyVisitedParks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Get all check-ins for a user
router.get('/checkins', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('recentlyVisitedParks.park');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ recentlyVisitedParks: user.recentlyVisitedParks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE: Remove a check-in
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.recentlyVisitedParks = user.recentlyVisitedParks.filter(
      (checkin) => checkin._id.toString() !== req.params.id
    );

    await user.save();
    res.status(200).json({ message: 'Check-in removed', recentlyVisitedParks: user.recentlyVisitedParks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;