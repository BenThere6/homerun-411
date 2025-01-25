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

  // Read parks from CSV file
  fs.createReadStream('parks.csv')
    .pipe(
      csvParser({
        mapHeaders: ({ header }) => header.trim(), // Trim headers
      })
    )
    .on('data', async (row) => {
      if (isFirstRow) {
        // console.log('CSV Headers:', Object.keys(row));
        isFirstRow = false;
      }

      // console.log('Row read from CSV:', JSON.stringify(row, null, 2));

      // Validate required fields
      if (!row.Name || !row.Address || !row.City || !row.State) {
        console.error('Skipping invalid row (missing required fields):', JSON.stringify(row, null, 2));
        return;
      }

      const park = {
        name: row.Name,
        address: row.Address,
        city: row.City,
        state: row.State,
      };

      console.log('log 1 : ', JSON.stringify(park, null, 2));

      // Fetch coordinates
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
        console.error(`Skipping park due to invalid coordinates: ${park.name}`);
        return;
      }

      park.coordinates = {
        type: 'Point',
        coordinates,
      };


      // Number of Fields
      park.numberOfFields = parseInt(row['Number of Fields'], 10) || 0;

      console.log('log 2 : ', JSON.stringify(park, null, 2));
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

      console.log('log 3 : ', JSON.stringify(park, null, 2));
      // Park-wide amenities and features
      if (row['Parking Location']) park.closestParkingToField = row['Parking Location'];
      if (row['Number of Handicap Spots']) {
        park.parking = { handicapSpots: parseInt(row['Number of Handicap Spots'], 10) || 0 };
      }
      if (row['Park Shade Description']) park.parkShade = row['Park Shade Description'];

      // Restrooms
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

      console.log('log 4 : ', JSON.stringify(park, null, 2));
      // Concessions
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

      console.log('log 5 : ', JSON.stringify(park, null, 2));
      // Playground
      park.playground = {
        available: row['Playground?'] === 'TRUE',
        location: row['Playground Location'] || null,
      };

      console.log('log 6 : ', JSON.stringify(park, null, 2));
      // Notes
      park.notes = row['OTHER NOTES'] || null;

      console.log('log 7 : ', JSON.stringify(park, null, 2));
      console.log('Processing park:', JSON.stringify(park, null, 2)); // Debugging: Log the park object

      if (Object.keys(park).length === 0) {
        console.error('Skipping empty park object:', park);
      } else {
        parks.push(park);
        console.log('Park added to array. Current parks array length:', parks.length); // Debugging: Confirm park addition
      }
    })
    .on('end', async () => {
      console.log('Final parks array:', JSON.stringify(parks, null, 2)); // Debugging: Log the final array

      if (parks.length === 0) {
        console.error('No parks to insert. Check your CSV or parsing logic.');
        process.exit(1);
      }

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