const mongoose = require('mongoose');
const fs = require('fs');
const csvParser = require('csv-parser');
const axios = require('axios'); // For making API requests
const Park = require('./models/Park');
require('dotenv').config();

// Google Maps Geocoding API Key
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/yourDatabaseName');

// Monitor MongoDB connection
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
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
  let isFirstRow = true;

  const processRow = async (row) => {
    try {
      if (isFirstRow) {
        console.log('CSV Headers:', Object.keys(row));
        isFirstRow = false;
      }

      console.log('Processing row:', JSON.stringify(row, null, 2));

      if (!row.Name || !row.Address || !row.City || !row.State) {
        console.warn('Skipping row with missing fields:', JSON.stringify(row, null, 2));
        return;
      }

      const park = {
        name: row.Name,
        address: row.Address,
        city: row.City,
        state: row.State,
      };

      let coordinates;
      try {
        console.log(`Fetching coordinates for: ${row.Address}, ${row.City}, ${row.State}`);
        coordinates = await getCoordinatesFromAddress(row.Address, row.City, row.State);
        console.log('Coordinates fetched:', coordinates);
      } catch (error) {
        console.error(`Error fetching coordinates for ${row.Address}:`, error);
        coordinates = null;
      }

      if (!coordinates) {
        console.warn(`Skipping park due to missing coordinates: ${park.name}`);
        return;
      }

      park.coordinates = {
        type: 'Point',
        coordinates,
      };

      park.numberOfFields = parseInt(row['Number of Fields'], 10) || 0;

      console.log('Number of fields:', park.numberOfFields);
      park.fields = [];
      for (let i = 1; i <= park.numberOfFields; i++) {
        const field = {
          name: row[`Field ${i} Name`] || null,
          location: row[`Field ${i} Location`] || null,
          fenceDistance: parseInt(row[`Field ${i} Fence Distance`], 10) || null,
          fieldType: row[`Field ${i} Type`] || null,
          outfieldMaterial: row[`Field ${i} Outfield Material`] || null,
          infieldMaterial: row[`Field ${i} Infield Material`] || null,
          moundType: row[`Field ${i} Mound Type`] || null,
          fieldShadeDescription: row[`Field ${i} Field Shade Description`] || null,
          parkingDistanceToField: row[`Field ${i} Parking Distance to Field`] || null,
          bleachersAvailable: row[`Field ${i} Bleachers?`] === 'TRUE',
          bleachersDescription: row[`Field ${i} Bleachers Description`] || null,
          backstopMaterial: row[`Field ${i} Backstop Material`] || null,
          backstopDistance: parseInt(row[`Field ${i} Backstop Distance (ft)`], 10) || null,
          dugoutsCovered: row[`Field ${i} Dugouts Covered?`] === 'TRUE',
          dugoutsMaterial: row[`Field ${i} Dugouts Material`] || null,
        };

        if (field.name) {
          park.fields.push(field);
        }
      }

      if (row['Parking Location']) park.closestParkingToField = row['Parking Location'];
      if (row['Number of Handicap Spots']) {
        park.parking = { handicapSpots: parseInt(row['Number of Handicap Spots'], 10) || 0 };
      }
      if (row['Park Shade Description']) park.parkShade = row['Park Shade Description'];

      park.restrooms = [];
      if (row['Restroom Location']) {
        park.restrooms.push({
          location: row['Restroom Location'],
          runningWater: row['Restroom Running Water?'] === 'TRUE',
          changingTable: row['Restroom Changing Table?'] || 'neither',
          womensStalls: row["Women's stalls"] || null,
          mensStallsUrinals: row["Men's Stalls/Urinals"] || null,
        });
      }

      park.concessions = {
        available: row['Concessions area'] === 'TRUE',
        snacks: row['Snacks?'] === 'TRUE',
        drinks: row['Drinks?'] === 'TRUE',
        otherFood: row['Other Food Description'] || null,
        paymentMethods: [],
      };
      if (row['Cash?'] === 'TRUE') park.concessions.paymentMethods.push('cash');
      if (row['Card?'] === 'TRUE') park.concessions.paymentMethods.push('card');
      if (row['Venmo?'] === 'TRUE') park.concessions.paymentMethods.push('venmo');
      if (row['Tap to pay?'] === 'TRUE') park.concessions.paymentMethods.push('tap to pay');

      park.playground = {
        available: row['Playground?'] === 'TRUE',
        location: row['Playground Location'] || null,
      };

      park.notes = row['OTHER NOTES'] || null;

      console.log('Final park object:', JSON.stringify(park, null, 2));
      parks.push(park);
      console.log('Park added to array. Current parks array length:', parks.length);
    } catch (error) {
      console.error('Error processing row:', error);
    }
  };

  fs.createReadStream('parks.csv')
    .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }))
    .on('error', (err) => {
      console.error('Error reading CSV:', err);
    })
    .on('data', (row) => processRow(row))
    .on('end', async () => {
      console.log('Final parks array:', JSON.stringify(parks, null, 2));

      if (parks.length === 0) {
        console.error('No parks to insert. Check your CSV or parsing logic.');
        mongoose.disconnect();
        return;
      }

      try {
        await Park.insertMany(parks);
        console.log('Parks imported successfully!');
      } catch (error) {
        console.error('Error inserting parks into MongoDB:', error);
      } finally {
        mongoose.disconnect();
      }
    });
}

importParks();