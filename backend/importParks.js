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

const normalizeEnumValue = (value, validValues) => {
  if (value && validValues.includes(value.toLowerCase())) {
    return value.toLowerCase();
  }
  return null; // Or a default value like `null` or 'unknown'
};

async function importParks() {
  const parks = [];
  let isFirstRow = true;
  const rowProcessingPromises = [];

  const processRow = async (row) => {
    try {
      if (isFirstRow) {
        // console.log('CSV Headers:', Object.keys(row));
        isFirstRow = false;
      }

      // console.log('Processing row:', JSON.stringify(row, null, 2));

      if (!row.Name || !row.Address || !row.City || !row.State) {
        console.warn('Skipping row with missing fields:', JSON.stringify(row, null, 2));
        return;
      }

      const validFieldTypes = ['baseball', 'softball', 'both'];
      const validOutfieldMaterials = ['grass', 'turf'];
      const validInfieldMaterials = ['grass', 'dirt'];
      const validMoundTypes = ['dirt', 'turf', 'portable'];
      const validBackstopMaterials = ['fence', 'net'];
      const validDugoutMaterials = ['brick', 'fence', 'wood'];
      const validChangingTableValues = ["men's", "women's", 'both', 'neither'];
      const validSpectatorSurfaces = ['grass', 'cement', 'gravel', 'dirt'];

      const toBoolean = (value) => (typeof value === 'string' ? value.trim().toLowerCase() === 'true' : !!value);

      const normalizeAddress = (address) => {
        if (!address) return null;
      
        return address
          .toLowerCase() // Convert entire string to lowercase
          .replace(/\b(?:west|w)\b/gi, 'W')
          .replace(/\b(?:east|e)\b/gi, 'E')
          .replace(/\b(?:south|s)\b/gi, 'S')
          .replace(/\b(?:north|n)\b/gi, 'N')
          .replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize every word
          .trim();
      };
      
      const park = {
        name: row.Name,
        address: normalizeAddress(row.Address),  // ✅ Apply improved formatting
        city: row.City,
        state: row.State.toUpperCase(),
        coolersAllowed: toBoolean(row['Coolers Allowed?']),
        canopiesAllowed: toBoolean(row['Canopies Allowed?']),
        battingCages: {
          shared: toBoolean(row['Shared Batting Cages?']),
          description: row['Shared Batting Cage Description']?.trim() || null,
        },
        numberOfParkingLots: parseInt(row['Number of Parking Lots'], 10) || null,
        rvParkingAvailable: toBoolean(row['RV Parking Available?']),
        bikeRackAvailability: toBoolean(row['Bike Rack Availability?']),
        electricalOutletsForPublicUse: toBoolean(row['Electrical Outlets for Public Use?']),
        stairsDescription: row['Stairs Description'] || null,
        hillsDescription: row['Hills Description'] || null,
        gateEntranceFee: toBoolean(row['Entrance Fee?']),
        otherNotes: row['OTHER NOTES'] || null,
        lights: toBoolean(row['Field Lights?']),
      };         

      try {
        console.log(`Fetching coordinates for: ${row.Address}, ${row.City}, ${row.State}`);
        const coordinates = await getCoordinatesFromAddress(row.Address, row.City, row.State);
        if (!coordinates) {
          console.warn(`Skipping park due to missing coordinates: ${park.name}`);
          return;
        }
        park.coordinates = {
          type: 'Point',
          coordinates,
        };
      } catch (error) {
        console.error(`Error fetching coordinates for ${row.Address}:`, error);
        return;
      }

      park.numberOfFields = parseInt(row['Number of Fields'], 10) || 0;

      console.log('Number of fields:', park.numberOfFields);
      park.fields = [];
      for (let i = 1; i <= park.numberOfFields; i++) {
        const field = {
          name: row[`Field ${i} Name`] || null,
          location: row[`Field ${i} Location`] || null,
          fenceDistance: parseInt(row[`Field ${i} Fence Distance`], 10) || null,
          fenceHeight: parseInt(row[`Field ${i} Fence Height`], 10) || null, // ✅ New fence height field
          fieldType: normalizeEnumValue(row[`Field ${i} Type`], validFieldTypes),
          outfieldMaterial: normalizeEnumValue(row[`Field ${i} Outfield Material`], validOutfieldMaterials),
          infieldMaterial: normalizeEnumValue(row[`Field ${i} Infield Material`], validInfieldMaterials),
          moundType: normalizeEnumValue(row[`Field ${i} Mound Type`], validMoundTypes),
          fieldShadeDescription: row[`Field ${i} Field Shade Description`] || null,
          parkingDistanceToField: row[`Field ${i} Parking Distance to Field`] || null,
          bleachersAvailable: toBoolean(row[`Field ${i} Bleachers?`]),
          bleachersDescription: row[`Field ${i} Bleachers Description`] || null,
          backstopMaterial: normalizeEnumValue(row[`Field ${i} Backstop Material`], validBackstopMaterials),
          backstopDistance: parseInt(row[`Field ${i} Backstop Distance (ft)`], 10) || null,
          dugoutsCovered: toBoolean(row[`Field ${i} Dugouts Covered?`]),
          dugoutsMaterial: normalizeEnumValue(row[`Field ${i} Dugouts Material`], validDugoutMaterials),
          scoreboardAvailable: toBoolean(row[`Field ${i} Scoreboard Available?`]),
          scoreboardType: row[`Field ${i} Scoreboard Type`] || null,
          warningTrack: toBoolean(row[`Field ${i} Warning Track?`]) || false,
          bullpenAvailable: toBoolean(row[`Field ${i} Bullpen Available?`]),
          bullpenLocation: row[`Field ${i} Bullpen Location`] || null,
          dugoutCoverageMaterial: row[`Field ${i} Dugout Coverage Material`] || null,
          battingCages: toBoolean(row[`Field ${i} Batting Cages?`]),
        };

        if (field.name) {
          park.fields.push(field);
        }
      }

      if (row['Parking Location']) park.closestParkingToField = row['Parking Location'];
      if (row['Number of Handicap Spots']) {
        park.parking = {
          locations: row['Parking Location'] ? [row['Parking Location']] : [],
          handicapSpots: parseInt(row['Number of Handicap Spots'], 10) || 0,
        };
      }
      if (row['Park Shade Description']) park.parkShade = row['Park Shade Description'];

      park.restrooms = [];
      if (row['Restroom Location']) {
        park.restrooms.push({
          location: row['Restroom Location'],
          runningWater: row['Restroom Running Water?']?.toLowerCase() === 'true',
          changingTable: normalizeEnumValue(row['Restroom Changing Table?'], validChangingTableValues),
          numStalls: parseInt(row["Women's stalls"], 10) || parseInt(row["Men's Stalls/Urinals"], 10) || null,
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



      if (row['Spectator Location Conditions']) {
        park.spectatorConditions = {
          locationTypes: row['Spectator Location Conditions']
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter((s) => validSpectatorSurfaces.includes(s)), // ✅ Only keep valid values
        };
      }

      console.log('Final park object:', JSON.stringify(park, null, 2));
      parks.push(park);
      console.log('Park added to array. Current parks array length:', parks.length);
    } catch (error) {
      console.error('Error processing row:', error);
    }
  };

  const processCSV = new Promise((resolve, reject) => {
    fs.createReadStream('parks.csv')
      .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }))
      .on('error', (err) => reject(err))
      .on('data', (row) => {
        rowProcessingPromises.push(processRow(row));
      })
      .on('end', resolve);
  });

  try {
    await processCSV;
    await Promise.all(rowProcessingPromises);

    console.log('Final parks array:', JSON.stringify(parks, null, 2));

    if (parks.length === 0) {
      console.error('No parks to insert. Check your CSV or processing logic.');
      mongoose.disconnect();
      return;
    }

    await Park.insertMany(parks);
    console.log('Parks imported successfully!');
  } catch (error) {
    console.error('Error processing CSV or inserting parks:', error);
  } finally {
    mongoose.disconnect();
  }
}

importParks();