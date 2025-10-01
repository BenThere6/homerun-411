const express = require('express');
const router = express.Router();

const ParkDataRequest = require('../../models/ParkDataRequest');
const FeatureSuggestion = require('../../models/FeatureSuggestion');

const authenticate = require('../../middleware/authenticate');
const isAdmin = require('../../middleware/isAdmin');     // level 0–1

// Helper: attach user + email if available
function pickSubmitter(req) {
  return {
    userId: req.user?.id,
    contactEmail: req.body?.contactEmail || req.user?.email,
  };
}

// --- PUBLIC: create a park data request ---
router.post('/park-data-request', authenticateOptional, async (req, res) => {
  try {
    const { parkId, parkName, city, state, message, source } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ message: 'message is required' });

    const doc = await ParkDataRequest.create({
      parkId, parkName, city, state,
      message: message.trim(),
      source: source || 'ParkDetails',
      ...pickSubmitter(req),
    });

    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// --- PUBLIC: create a feature suggestion ---
router.post('/feature-request', authenticateOptional, async (req, res) => {
  try {
    const { title, description, parkContext, source } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'title is required' });

    const doc = await FeatureSuggestion.create({
      title: title.trim(),
      description: description?.trim(),
      parkContext,
      source: source || 'ParkDetails',
      ...pickSubmitter(req),
    });

    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// --- ADMIN: list inbox (both types) ---
router.get('/admin', authenticate, isAdmin, async (req, res) => {
  try {
    const { type, status, parkId, q, page = 1, limit = 20 } = req.query;
    const nLimit = Math.min(100, Number(limit) || 20);
    const skip = (Math.max(1, Number(page) || 1) - 1) * nLimit;

    const buildQuery = () => {
      const query = {};
      if (status) query.status = status;
      if (parkId) query.parkId = parkId;
      if (q) {
        const re = new RegExp(String(q), 'i');
        query.$or = [
          { message: re }, { title: re }, { description: re }, { parkName: re }
        ];
      }
      return query;
    };

    if (type === 'feature') {
      const query = buildQuery();
      const [items, total] = await Promise.all([
        FeatureSuggestion.find(query).sort({ createdAt: -1 }).skip(skip).limit(nLimit),
        FeatureSuggestion.countDocuments(query),
      ]);
      return res.json({ items, total, page: Number(page), limit: nLimit });
    }

    const query = buildQuery();
    const [items, total] = await Promise.all([
      ParkDataRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(nLimit),
      ParkDataRequest.countDocuments(query),
    ]);
    return res.json({ items, total, page: Number(page), limit: nLimit });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// --- ADMIN: update status/notes/assignee ---
router.patch('/admin/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    if (req.body.status) update.status = req.body.status;
    if (req.body.notes !== undefined) update.notes = req.body.notes;
    if (req.body.handledBy !== undefined) update.handledBy = req.body.handledBy || req.user?.id;

    let doc = await ParkDataRequest.findByIdAndUpdate(id, update, { new: true });
    if (!doc) doc = await FeatureSuggestion.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });

    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

/** ---- optional auth-or-guest middleware ---- */
function authenticateOptional(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return next();
  const authenticate = require('../../middleware/authenticate');
  authenticate(req, res, next);
}