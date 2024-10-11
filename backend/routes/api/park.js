const express = require('express');
const router = express.Router();
const Park = require('../../models/Park');
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
      address, // Include address
      city, // Include city
      state, // Include state
      coordinates,
      googleMaps, // Include Google Maps data
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
      fieldTypes,
    } = req.body;

    const newPark = new Park({
      name,
      address, // Save address
      city, // Save city
      state, // Save state
      coordinates,
      googleMaps, // Save Google Maps data
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
      fieldTypes,
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

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ message: 'Latitude and longitude must be valid numbers' });
    }

    const parks = await Park.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat],
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

// Search parks by field type
router.get('/searchByFieldType', async (req, res) => {
  try {
    const fieldType = req.query.fieldType; // Get field type from query
    const parks = await Park.find({ fieldTypes: fieldType });

    res.json(parks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get or update comprehensive weather for a specific park by ID
router.get('/:parkId/weather', async (req, res) => {
  try {
    const parkId = req.params.parkId;
    const park = await Park.findById(parkId);
    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }

    // Always fetch fresh weather data for comprehensive info
    const weather = await fetchComprehensiveWeatherFromAPI(park.coordinates);

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
    'address', // Allow update of address
    'city', // Allow update of city
    'state', // Allow update of state
    'coordinates',
    'googleMaps', // Include Google Maps data
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
    'fieldTypes',
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
    const deletedPark = await Park.findByIdAndDelete(req.params.id);
    if (!deletedPark) {
      return res.status(404).json({ message: 'Park not found' });
    }
    res.json({ message: 'Park deleted successfully', deletedPark });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;