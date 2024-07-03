const express = require('express');
const router = express.Router();
const Weather = require('../models/Weather');
const auth = require('../middleware/auth'); // Import the auth middleware

// Middleware function to fetch weather by ID
async function getWeather(req, res, next) {
  let weather;
  try {
    weather = await Weather.findById(req.params.id);
    if (weather == null) {
      return res.status(404).json({ message: 'Weather data not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.weather = weather;
  next();
}

// Create weather data for a park
router.post('/weather', auth, async (req, res) => { // Apply auth middleware
  try {
    const { park, temperature, conditions } = req.body;

    const newWeather = new Weather({
      park,
      temperature,
      conditions,
    });

    const savedWeather = await newWeather.save();
    res.status(201).json(savedWeather);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all weather data
router.get('/weather', async (req, res) => {
  try {
    const weatherData = await Weather.find();
    res.json(weatherData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get weather data by ID
router.get('/weather/:id', getWeather, (req, res) => {
  res.json(res.weather);
});

// Update weather data by ID
router.patch('/weather/:id', auth, getWeather, async (req, res) => { // Apply auth middleware
  if (req.body.temperature != null) {
    res.weather.temperature = req.body.temperature;
  }
  if (req.body.conditions != null) {
    res.weather.conditions = req.body.conditions;
  }

  try {
    const updatedWeather = await res.weather.save();
    res.json(updatedWeather);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete weather data by ID
router.delete('/weather/:id', auth, getWeather, async (req, res) => { // Apply auth middleware
  try {
    await res.weather.remove();
    res.json({ message: 'Deleted weather data' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;