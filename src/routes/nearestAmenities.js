const express = require('express');
const router = express.Router();
const NearestAmenity = require('../models/NearestAmenity');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Middleware function to fetch an amenity by ID
async function getAmenity(req, res, next) {
  let amenity;
  try {
    amenity = await NearestAmenity.findById(req.params.id);
    if (amenity == null) {
      return res.status(404).json({ message: 'Amenity not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.amenity = amenity;
  next();
}

// Create a new amenity
router.post('/amenities', auth, isAdmin, async (req, res) => {
  try {
    const { referencedPark, locationType, address, coordinates, distanceFromPark } = req.body;
    const newAmenity = new NearestAmenity({
      referencedPark,
      locationType,
      address,
      coordinates,
      distanceFromPark,
    });
    const savedAmenity = await newAmenity.save();
    res.status(201).json(savedAmenity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all amenities
router.get('/amenities', async (req, res) => {
  try {
    const amenities = await NearestAmenity.find();
    res.json(amenities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific amenity by ID
router.get('/amenities/:id', getAmenity, (req, res) => {
  res.json(res.amenity);
});

// Update a specific amenity by ID
router.patch('/amenities/:id', auth, isAdmin, getAmenity, async (req, res) => {
  if (req.body.referencedPark != null) {
    res.amenity.referencedPark = req.body.referencedPark;
  }
  if (req.body.locationType != null) {
    res.amenity.locationType = req.body.locationType;
  }
  if (req.body.address != null) {
    res.amenity.address = req.body.address;
  }
  if (req.body.coordinates != null) {
    res.amenity.coordinates = req.body.coordinates;
  }
  if (req.body.distanceFromPark != null) {
    res.amenity.distanceFromPark = req.body.distanceFromPark;
  }

  try {
    const updatedAmenity = await res.amenity.save();
    res.json(updatedAmenity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific amenity by ID
router.delete('/amenities/:id', auth, isAdmin, getAmenity, async (req, res) => {
  try {
    await res.amenity.remove();
    res.json({ message: 'Deleted amenity' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;