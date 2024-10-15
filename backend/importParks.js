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
      park.name = row.Name;
      park.address = row.Address;
      park.city = row.City;
      park.state = row.State;

      // Convert address to coordinates
      const coordinates = await getCoordinatesFromAddress(row.Address, row.City, row.State);
      if (!coordinates) {
        console.error(`Skipping park due to invalid address: ${row.Name}`);
        return;
      }

      park.coordinates = {
        type: 'Point',
        coordinates, // Set the coordinates fetched from the Geocoding API
      };

      // Number of Fields
      park.numberOfFields = parseInt(row['Number of Fields'], 10) || 0;

      // Fields array (up to 8 fields as per provided structure)
      park.fields = [];
      for (let i = 1; i <= park.numberOfFields; i++) {
        const field = {
          name: row[`Field ${i} Name`],
          location: row[`Field ${i} Location`],
          fenceDistance: parseInt(row[`Field ${i} Fence Distance`], 10) || null,
          fieldType: row[`Field ${i} Type`] || null,
          outfieldMaterial: row[`Field ${i} Outfield Material`] || null,
          infieldMaterial: row[`Field ${i} Infield Material`] || null,
          moundType: row[`Field ${i} Mound Type`] || null,
          fieldShadeDescription: row[`Field ${i} Field Shade Description`] || null,
          parkingDistanceToField: row[`Field ${i} Parking Distance to Field`] || null,
          bleachersAvailable: row[`Field ${i} Bleachers?`] === 'true',
          bleachersDescription: row[`Field ${i} Bleachers Description`] || null,
          backstopMaterial: row[`Field ${i} Backstop Material`] || null,
          backstopDistance: parseInt(row[`Field ${i} Backstop Distance (ft)`], 10) || null,
          dugoutsCovered: row[`Field ${i} Dugouts Covered?`] === 'true',
          dugoutsMaterial: row[`Field ${i} Dugouts Material`] || null
        };

        if (field.name) {
          park.fields.push(field);
        }
      }

      // Park-wide amenities and features
      if (row['Parking Location']) park.closestParkingToField = row['Parking Location'];
      if (row['Number of Handicap Spots']) park.parking = { handicapSpots: parseInt(row['Number of Handicap Spots'], 10) || 0 };
      if (row['Park Shade Description']) park.parkShade = row['Park Shade Description'];

      // Restrooms
      park.restrooms = [];
      if (row['Restroom Location']) {
        park.restrooms.push({
          location: row['Restroom Location'],
          runningWater: row['Restroom Running Water?'] === 'true',
          changingTable: row['Restroom Changing Table?'] || 'neither',
          numStalls: parseInt(row['Restroom Number of Stalls'], 10) || null,
        });
      }

      // Concessions
      park.concessions = {
        available: row['Concessions Available?'] === 'true',
        snacks: row['Snacks?'] === 'true',
        drinks: row['Drinks?'] === 'true',
        otherFood: row['Other Food Description'] || null,
        paymentMethods: []
      };
      if (row['Cash?'] === 'true') park.concessions.paymentMethods.push('cash');
      if (row['Card?'] === 'true') park.concessions.paymentMethods.push('card');
      if (row['Venmo?'] === 'true') park.concessions.paymentMethods.push('venmo');
      if (row['Tap to pay?'] === 'true') park.concessions.paymentMethods.push('apple pay');

      // Miscellaneous fields
      if (row['Coolers Allowed?']) park.coolersAllowed = row['Coolers Allowed?'] === 'true';
      if (row['Canopies Allowed?']) park.canopiesAllowed = row['Canopies Allowed?'] === 'true';
      if (row['Field Lights?']) park.lights = row['Field Lights?'] === 'true';
      if (row['Fence Distance (ft)']) park.fenceDistance = parseInt(row['Fence Distance (ft)'], 10) || null;
      if (row['Electrical Outlets for Public Use?']) park.powerAccess = {
        available: row['Electrical Outlets for Public Use?'] === 'true',
        locations: row['Location of Electrical Outlets'] ? [row['Location of Electrical Outlets']] : []
      };
      if (row['Sidewalks']) park.sidewalks = row['Sidewalks'] === 'true';
      if (row['Stairs Description']) park.stairs = row['Stairs Description'] === 'true';
      if (row['Hills Description']) park.hills = row['Hills Description'] === 'true';
      if (row['Entrance Fee?']) park.gateEntranceFee = row['Entrance Fee?'] === 'true';

      // Playground
      park.playground = {
        available: row['Playground?'] === 'true',
        location: row['Playground Location'] || null,
      };

      // Spectator Conditions
      if (row['Spectator Location Conditions']) {
        park.spectatorConditions = {
          locationTypes: row['Spectator Location Conditions'].split(',').map(s => s.trim()),
        };
      }

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