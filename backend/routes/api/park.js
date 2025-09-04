const express = require('express');
const router = express.Router();
const Park = require('../../models/Park');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');
const User = require('../../models/User');

const { cleanFeatureCollection, fetchNearby } = require('../../utils/mapPipeline');

function haversineMeters(a, b) {
  const toRad = d => d * Math.PI / 180, R = 6371000;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

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
      electricalOutletsForPublicUse,
      electricalOutletsLocation,
      sidewalks,
      gravelPaths,
      stairs,
      hills,
      gateEntranceFee,
      playground,
      spectatorConditions,
      fieldTypes,
      isPetFriendly,
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
      electricalOutletsForPublicUse,
      electricalOutletsLocation,
      sidewalks,
      gravelPaths,
      stairs,
      hills,
      gateEntranceFee,
      playground,
      spectatorConditions,
      fieldTypes,
      isPetFriendly,
    });

    const savedPark = await newPark.save();
    res.status(201).json(savedPark);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all parks
router.get('/', auth, async (req, res) => {
  try {
    const parks = await Park.find();
    const user = await User.findById(req.user.id);

    const toRad = angle => (angle * Math.PI) / 180;
    const R = 3958.8;

    const calculateDistance = (userCoords, parkCoords) => {
      if (!userCoords || !parkCoords) return null;
      const [lon1, lat1] = userCoords;
      const [lon2, lat2] = parkCoords;

      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round((R * c) * 10) / 10;
    };

    const enrichedParks = parks.map(park => {
      const distanceInMiles = calculateDistance(
        user.location?.coordinates,
        park.coordinates?.coordinates
      );
      return {
        ...park.toObject(),
        distanceInMiles,
      };
    });

    res.json(enrichedParks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/park/searchByCityWithNearby?city=Bountiful&lat=40.9&lon=-111.88
router.get('/searchByCityWithNearby', async (req, res) => {
  const { city, lat, lon } = req.query;

  if (!city || !lat || !lon) {
    return res.status(400).json({ message: 'City, lat, and lon are required.' });
  }

  const userCoords = [parseFloat(lon), parseFloat(lat)];

  const cityMatches = await Park.find({ city: { $regex: `^${city}$`, $options: 'i' } });

  const nearbyParks = await Park.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: userCoords },
        distanceField: 'distanceInMeters',
        spherical: true,
        query: { city: { $not: { $regex: `^${city}$`, $options: 'i' } } },
      },
    },
    {
      $addFields: {
        distanceInMiles: {
          $round: [{ $divide: ['$distanceInMeters', 1609.34] }, 1],
        },
      },
    },
  ]);

  res.json({ cityMatches, nearbyParks });
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
  console.log("Fetched Park Data:", JSON.stringify(res.park, null, 2));
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
    'isPetFriendly',
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

// POST raw geojson -> cleaned -> save
router.post('/:id/map/geojson', auth, isAdmin, async (req, res) => {
  try {
    const park = await Park.findById(req.params.id);
    if (!park) return res.status(404).json({ message: 'Park not found' });

    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const cleaned = cleanFeatureCollection(raw);

    park.mapFeatures = cleaned;
    await park.save();

    res.json({ ok: true, features: cleaned.features.length });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// POST ingest nearby (one-time or refresh)
router.post('/:id/map/nearby', auth, isAdmin, async (req, res) => {
  try {
    const park = await Park.findById(req.params.id);
    if (!park) return res.status(404).json({ message: 'Park not found' });

    const [lng, lat] = park.coordinates?.coordinates || [];
    if (!lat || !lng) return res.status(400).json({ message: 'Park lacks coordinates' });

    const results = await fetchNearby({ lat, lng, radius: 1500 });

    // dedupe by placeId
    const byId = {};
    for (const r of results) byId[r.placeId] = r;
    const unique = Object.values(byId);

    // compute distance to park center
    const center = { lat, lng };
    for (const u of unique) {
      u.distanceMeters = Math.round(
        haversineMeters(center, { lat: u.location.lat, lng: u.location.lng })
      );
      u.lastRefreshed = new Date();
    }

    park.nearbyAmenities = unique;
    await park.save();
    res.json({ ok: true, count: unique.length });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET bundle for the app
router.get('/:id/map', async (req, res) => {
  const park = await Park.findById(req.params.id).lean();
  if (!park) return res.status(404).json({ message: 'Park not found' });

  const [lng, lat] = park.coordinates?.coordinates || [];
  res.json({
    center: { lat, lng },
    mapFeatures: park.mapFeatures || { type: 'FeatureCollection', features: [] },
    nearbyAmenities: park.nearbyAmenities || [],
  });
});

module.exports = router;