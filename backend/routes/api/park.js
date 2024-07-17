const express = require('express');
const router = express.Router();
const Park = require('../../models/Park');
// const Weather = require('../../models/Weather');
const NearestAmenity = require('../../models/NearestAmenity');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');
// const fetch = require('node-fetch');

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

async function fetchComprehensiveWeatherFromAPI(parkCoordinates) {
  const apiKey = process.env.OPEN_WEATHER_API; // Accessing the API key from environment variables
  // Assuming parkCoordinates is an object with properties `latitude` and `longitude`
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${parkCoordinates.coordinates[0]}&lon=${parkCoordinates.coordinates[1]}&appid=${apiKey}&units=metric`;

  let response;
  try {
      response = await fetch(url);
      const data = await response.json();  // Parse JSON irrespective of response status

      if (!response.ok) {
          // Include specific API error information in the thrown error
          throw new Error(`Failed to fetch weather data: ${response.status} ${response.statusText} - ${data.message}`);
      }

      return {
          current: {
              temperature: data.main.temp,
              feels_like: data.main.feels_like,
              description: data.weather[0].description, // Using 'description' for more detail
              icon: data.weather[0].icon,
              wind_speed: data.wind.speed,
              wind_deg: data.wind.deg,
              // Note: UV index is not available in the basic /weather endpoint; it's available in the /onecall endpoint
              sunrise: new Date(data.sys.sunrise * 1000),
              sunset: new Date(data.sys.sunset * 1000),
          }
          // Hourly and daily forecasts would be extracted here if using the OneCall API
      };
  } catch (error) {
      // If the error is thrown by fetch itself or there is a network issue
      throw new Error(`Network or parsing error while fetching weather data: ${error.message}`);
  }
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

    // Validate latitude and longitude
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ message: 'Latitude and longitude must be valid numbers' });
    }

    // Find parks near the provided coordinates within a certain radius (using MongoDB geospatial queries)
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