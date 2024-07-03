const express = require('express');
const router = express.Router();
const Park = require('../models/Park');

// Middleware function to fetch a park by ID
async function getPark(req, res, next) {
  let park;
  try {
    park = await Park.findById(req.params.id);
    if (park == null) {
      return res.status(404).json({ message: 'Park not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.park = park;
  next();
}

// Create a new park
router.post('/parks', async (req, res) => {
  try {
    const {
      name,
      coordinates,
      interactiveMapPositionDetails,
      satelliteImageUrl,
      pictures,
      closestParkingToField,
      bleachers,
      handicapAccess,
      concessions,
      coolersAllowed,
      canopiesAllowed,
      surfaceMaterial,
      lights,
      restrooms,
      fenceDistance,
      powerWaterAccess,
      cellReception,
      shadedAreas,
      playground,
      moundType,
    } = req.body;

    const newPark = new Park({
      name,
      coordinates,
      interactiveMapPositionDetails,
      satelliteImageUrl,
      pictures,
      closestParkingToField,
      bleachers,
      handicapAccess,
      concessions,
      coolersAllowed,
      canopiesAllowed,
      surfaceMaterial,
      lights,
      restrooms,
      fenceDistance,
      powerWaterAccess,
      cellReception,
      shadedAreas,
      playground,
      moundType,
    });

    const savedPark = await newPark.save();
    res.status(201).json(savedPark);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all parks
router.get('/parks', async (req, res) => {
  try {
    const parks = await Park.find();
    res.json(parks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific park by ID
router.get('/parks/:id', getPark, (req, res) => {
  res.json(res.park);
});

// Update a specific park by ID
router.patch('/parks/:id', getPark, async (req, res) => {
  if (req.body.name != null) {
    res.park.name = req.body.name;
  }
  if (req.body.coordinates != null) {
    res.park.coordinates = req.body.coordinates;
  }
  if (req.body.interactiveMapPositionDetails != null) {
    res.park.interactiveMapPositionDetails = req.body.interactiveMapPositionDetails;
  }
  if (req.body.satelliteImageUrl != null) {
    res.park.satelliteImageUrl = req.body.satelliteImageUrl;
  }
  if (req.body.pictures != null) {
    res.park.pictures = req.body.pictures;
  }
  if (req.body.closestParkingToField != null) {
    res.park.closestParkingToField = req.body.closestParkingToField;
  }
  if (req.body.bleachers != null) {
    res.park.bleachers = req.body.bleachers;
  }
  if (req.body.handicapAccess != null) {
    res.park.handicapAccess = req.body.handicapAccess;
  }
  if (req.body.concessions != null) {
    res.park.concessions = req.body.concessions;
  }
  if (req.body.coolersAllowed != null) {
    res.park.coolersAllowed = req.body.coolersAllowed;
  }
  if (req.body.canopiesAllowed != null) {
    res.park.canopiesAllowed = req.body.canopiesAllowed;
  }
  if (req.body.surfaceMaterial != null) {
    res.park.surfaceMaterial = req.body.surfaceMaterial;
  }
  if (req.body.lights != null) {
    res.park.lights = req.body.lights;
  }
  if (req.body.restrooms != null) {
    res.park.restrooms = req.body.restrooms;
  }
  if (req.body.fenceDistance != null) {
    res.park.fenceDistance = req.body.fenceDistance;
  }
  if (req.body.powerWaterAccess != null) {
    res.park.powerWaterAccess = req.body.powerWaterAccess;
  }
  if (req.body.cellReception != null) {
    res.park.cellReception = req.body.cellReception;
  }
  if (req.body.shadedAreas != null) {
    res.park.shadedAreas = req.body.shadedAreas;
  }
  if (req.body.playground != null) {
    res.park.playground = req.body.playground;
  }
  if (req.body.moundType != null) {
    res.park.moundType = req.body.moundType;
  }

  try {
    const updatedPark = await res.park.save();
    res.json(updatedPark);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific park by ID
router.delete('/parks/:id', getPark, async (req, res) => {
  try {
    await res.park.remove();
    res.json({ message: 'Deleted park' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;