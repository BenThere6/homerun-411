const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Notification = require('../models/Notification');

// GET /api/notifications?unreadOnly=true&limit=20
router.get('/', auth, async (req, res) => {
  try {
    const { unreadOnly, limit = 20 } = req.query;
    const query = { user: req.user.id, ...(String(unreadOnly) === 'true' ? { read: false } : {}) };

    const items = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(100, Number(limit) || 20)))
      .populate('actor', 'profile.firstName profile.lastName profile.avatarUrl')
      .populate('post', 'title')
      .populate('comment', 'content');

    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, read: false });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', auth, async (req, res) => {
  try {
    const ret = await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
    res.json({ modified: ret.modifiedCount || ret.nModified || 0 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;