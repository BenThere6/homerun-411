const express = require('express');
const router = express.Router();
const Park = require('../../models/Park');
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
      parking,
      parkShade,
      bleachers,
      concessions,
      coolersAllowed,
      canopiesAllowed,
      surfaceMaterial,
      lights,
      restrooms,
      fenceDistance,
      powerAccess, // Use power access
      sidewalks,
      gravelPaths,
      stairs,
      hills,
      gateEntranceFee,
      playground,
      spectatorConditions,
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
      parking,
      parkShade,
      bleachers,
      concessions,
      coolersAllowed,
      canopiesAllowed,
      surfaceMaterial,
      lights,
      restrooms,
      fenceDistance,
      powerAccess, // Save power access
      sidewalks,
      gravelPaths,
      stairs,
      hills,
      gateEntranceFee,
      playground,
      spectatorConditions,
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
    const fieldType = req.query.fieldType;
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

    const weather = await fetchComprehensiveWeatherFromAPI(park.coordinates);
    res.json(weather);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific park by ID
router.get('/:id', getPark, (req, res) => {
  console.log("Fetched Park Data:", JSON.stringify(park, null, 2));
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
    'parking',
    'parkShade',
    'bleachers',
    'concessions',
    'coolersAllowed',
    'canopiesAllowed',
    'surfaceMaterial',
    'lights',
    'restrooms',
    'fenceDistance',
    'powerAccess', // Update power access
    'sidewalks',
    'gravelPaths',
    'stairs',
    'hills',
    'gateEntranceFee',
    'playground',
    'spectatorConditions',
    'fieldTypes',
  ];

  updateFields.forEach((field) => {
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

router.patch('/:id/main-image', auth, isAdmin, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    const park = await Park.findById(req.params.id);
    if (!park) return res.status(404).json({ message: "Park not found" });

    park.mainImageUrl = imageUrl;
    await park.save();

    res.json({ message: "Main image updated", mainImageUrl: imageUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:parkId/category-main-image', auth, isAdmin, async (req, res) => {
  try {
    const { imageId } = req.body;
    if (!imageId) {
      return res.status(400).json({ message: "Image ID is required" });
    }

    const park = await Park.findById(req.params.parkId);
    if (!park) return res.status(404).json({ message: "Park not found" });

    const image = park.images.id(imageId);
    if (!image) return res.status(404).json({ message: "Image not found in this park" });

    // Clear any existing isCategoryMain
    park.images.forEach((img) => {
      if (img.label === image.label) {
        img.isCategoryMain = false;
      }
    });

    // Set the new one
    image.isCategoryMain = true;
    await park.save();

    res.json({ message: `Main image set for category '${image.label}'`, image });
  } catch (err) {
    res.status(500).json({ message: err.message });
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