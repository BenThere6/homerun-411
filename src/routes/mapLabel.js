const express = require('express');
const router = express.Router();
const MapLabel = require('../models/MapLabel');
// const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Middleware function to fetch a map label by ID
async function getMapLabel(req, res, next) {
  let label;
  try {
    label = await MapLabel.findById(req.params.id);
    if (label == null) {
      return res.status(404).json({ message: 'Map label not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.label = label;
  next();
}

// Create a new map label
router.post('/maplabels', isAdmin, async (req, res) => {
  try {
    const { referencedPark, labelName, coordinates } = req.body;
    const newLabel = new MapLabel({
      referencedPark,
      labelName,
      coordinates,
    });
    const savedLabel = await newLabel.save();
    res.status(201).json(savedLabel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all map labels
router.get('/maplabels', async (req, res) => {
  try {
    const labels = await MapLabel.find();
    res.json(labels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific map label by ID
router.get('/maplabels/:id', getMapLabel, (req, res) => {
  res.json(res.label);
});

// Update a specific map label by ID
router.patch('/maplabels/:id', isAdmin, getMapLabel, async (req, res) => {
  if (req.body.referencedPark != null) {
    res.label.referencedPark = req.body.referencedPark;
  }
  if (req.body.labelName != null) {
    res.label.labelName = req.body.labelName;
  }
  if (req.body.coordinates != null) {
    res.label.coordinates = req.body.coordinates;
  }

  try {
    const updatedLabel = await res.label.save();
    res.json(updatedLabel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific map label by ID
router.delete('/maplabels/:id', isAdmin, getMapLabel, async (req, res) => {
  try {
    await res.label.remove();
    res.json({ message: 'Deleted map label' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;