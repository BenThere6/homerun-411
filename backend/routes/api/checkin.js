const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Park = require('../../models/Park');
const auth = require('../../middleware/auth');

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

module.exports = router;