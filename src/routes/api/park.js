const express = require('express');
const router = express.Router();
const Park = require('../../models/Park');
const Weather = require('../../models/Weather');
const NearestAmenity = require('../../models/NearestAmenity');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');

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
router.post('/', auth, isAdmin, async (req, res) => {
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
router.get('/', async (req, res) => {
  try {
    const parks = await Park.find();
    res.json(parks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search parks by name
router.get('/search', async (req, res) => {
  try {
    const parkName = req.query.name;
    const parks = await Park.find({ name: { $regex: parkName, $options: 'i' } });

    res.json(parks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search parks by coordinates
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    // Find parks near the provided coordinates within a certain radius (using MongoDB geospatial queries)
    const parks = await Park.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 10000, // Maximum distance in meters (adjust as needed)
        },
      },
    });

    res.json(parks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get weather for a specific park by ID
router.get('/:parkId/weather', async (req, res) => {
  try {
    const parkId = req.params.parkId;

    // Assuming Weather model is correctly populated with weather data for each park
    const weather = await Weather.findOne({ park: parkId }).sort({ updatedAt: -1 });

    res.json(weather);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get amenities for a specific park by ID
router.get('/:parkId/amenities', async (req, res) => {
  try {
    const parkId = req.params.parkId;
    const amenities = await NearestAmenity.find({ referencedPark: parkId });

    res.json(amenities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific park by ID
router.get('/:id', getPark, (req, res) => {
  res.json(res.park);
});

// Update a specific park by ID
router.patch('/:id', auth, isAdmin, getPark, async (req, res) => {
  const updateFields = [
    'name',
    'coordinates',
    'interactiveMapPositionDetails',
    'satelliteImageUrl',
    'pictures',
    'closestParkingToField',
    'bleachers',
    'handicapAccess',
    'concessions',
    'coolersAllowed',
    'canopiesAllowed',
    'surfaceMaterial',
    'lights',
    'restrooms',
    'fenceDistance',
    'powerWaterAccess',
    'cellReception',
    'shadedAreas',
    'playground',
    'moundType',
  ];

  updateFields.forEach(field => {
    if (req.body[field] != null) {
      res.park[field] = req.body[field];
    }
  });

  try {
    const updatedPark = await res.park.save();
    res.json(updatedPark);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific park by ID
router.delete('/:id', auth, isAdmin, getPark, async (req, res) => {
  try {
    await res.park.remove();
    res.json({ message: 'Deleted park' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;