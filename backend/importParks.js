const mongoose = require('mongoose');
const fs = require('fs');
const csvParser = require('csv-parser');
const axios = require('axios'); // For making API requests
const Park = require('./models/Park');

// Google Maps Geocoding API Key (replace with your own key)
const GEOCODING_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; 

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/yourDatabaseName', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Function to get coordinates from the address using Google Maps Geocoding API
async function getCoordinatesFromAddress(address, city, state) {
  const fullAddress = `${address}, ${city}, ${state}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GEOCODING_API_KEY}`;

  try {
    const response = await axios.get(url);
    if (response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return [lng, lat]; // [longitude, latitude] for MongoDB 2dsphere
    } else {
      console.error(`No results found for address: ${fullAddress}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching coordinates for address: ${fullAddress}`, error);
    return null;
  }
}

async function importParks() {
  const parks = [];

  // Read parks from CSV file
  fs.createReadStream('parks.csv')
    .pipe(csvParser())
    .on('data', async (row) => {
      const park = {};

      // Required fields
      park.name = row.name;
      park.address = row.address;
      park.city = row.city;
      park.state = row.state;
      park.fieldTypes = row.fieldTypes;

      // Convert address to coordinates
      const coordinates = await getCoordinatesFromAddress(row.address, row.city, row.state);
      if (!coordinates) {
        console.error(`Skipping park due to invalid address: ${row.name}`);
        return;
      }

      park.coordinates = {
        type: 'Point',
        coordinates, // Set the coordinates fetched from the Geocoding API
      };

      // Optional fields - only include if present in CSV
      if (row.interactiveMapPositionDetails) park.interactiveMapPositionDetails = row.interactiveMapPositionDetails;
      if (row.satelliteImageUrl) park.satelliteImageUrl = row.satelliteImageUrl;

      park.pictures = {};
      if (row.mainImageUrl) park.pictures.mainImageUrl = row.mainImageUrl;
      if (row.dugoutUrl) park.pictures.dugoutUrl = row.dugoutUrl;
      if (row.sidelinesUrl) park.pictures.sidelinesUrl = row.sidelinesUrl;
      if (row.shadedAreasUrl) park.pictures.shadedAreasUrl = row.shadedAreasUrl;

      if (row.closestParkingToField) park.closestParkingToField = row.closestParkingToField;
      if (row.bleachers) park.bleachers = row.bleachers === 'true';

      park.handicapAccess = {};
      if (row.hasHandicapAccess) park.handicapAccess.hasAccess = row.hasHandicapAccess === 'true';
      if (row.handicapDetails) park.handicapAccess.details = row.handicapDetails;

      park.concessions = {};
      if (row.concessionsAvailable) park.concessions.available = row.concessionsAvailable === 'true';
      if (row.concessionsDetails) park.concessions.details = row.concessionsDetails;
      if (row.paymentMethods) park.concessions.paymentMethods = row.paymentMethods ? row.paymentMethods.split(',') : [];

      if (row.coolersAllowed) park.coolersAllowed = row.coolersAllowed === 'true';
      if (row.canopiesAllowed) park.canopiesAllowed = row.canopiesAllowed === 'true';
      if (row.surfaceMaterial) park.surfaceMaterial = row.surfaceMaterial;
      if (row.lights) park.lights = row.lights === 'true';
      if (row.restrooms) park.restrooms = row.restrooms;
      if (row.fenceDistance) park.fenceDistance = parseInt(row.fenceDistance, 10);
      if (row.powerWaterAccess) park.powerWaterAccess = row.powerWaterAccess === 'true';
      if (row.cellReception) park.cellReception = row.cellReception === 'true';

      park.shadedAreas = {};
      if (row.shadedAreasAvailable) park.shadedAreas.available = row.shadedAreasAvailable === 'true';

      park.playground = {};
      if (row.playgroundAvailable) park.playground.available = row.playgroundAvailable === 'true';
      if (row.playgroundCloseToParking) park.playground.closeToParking = row.playgroundCloseToParking === 'true';

      if (row.moundType) park.moundType = row.moundType;

      // Add the park to the array
      parks.push(park);
    })
    .on('end', async () => {
      try {
        // Bulk insert into MongoDB
        await Park.insertMany(parks);
        console.log('Parks imported successfully!');
        process.exit();
      } catch (error) {
        console.error('Error importing parks:', error);
        process.exit(1);
      }
    });
}

importParks();