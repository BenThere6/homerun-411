const mongoose = require('mongoose');
const fs = require('fs');
const csvParser = require('csv-parser');
const axios = require('axios'); // For making API requests
const Park = require('../../models/Park');
require('dotenv').config();

// Google Maps Geocoding API Key
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/yourDatabaseName');

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

// Normalizes a value based on allowed enum values.
const normalizeEnumValue = (value, validValues) => {
  if (value && validValues.includes(value.toLowerCase())) {
    return value.toLowerCase();
  }
  return null;
};

// Updated helper function to safely parse integers.
// Returns null if the value is falsy, equals "nan", or cannot be parsed.
function safeParseInt(value) {
  if (!value || value.trim().toLowerCase() === 'nan') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

// Converts a value to Boolean.
function toBoolean(value) {
  return typeof value === 'string'
    ? value.trim().toLowerCase() === 'true'
    : !!value;
}

// Normalizes an address string.
function normalizeAddress(address) {
  if (!address) return null;
  return address
    .toLowerCase()
    .replace(/\b(?:west|w)\b/gi, 'W')
    .replace(/\b(?:east|e)\b/gi, 'E')
    .replace(/\b(?:south|s)\b/gi, 'S')
    .replace(/\b(?:north|n)\b/gi, 'N')
    .replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
    .trim();
}

// Maps the CSV value for the changing table to one of the allowed enum strings.
function mapChangingTable(value) {
  if (!value) return 'neither'; // Default if missing
  const lower = value.trim().toLowerCase();
  if (lower === 'true') return 'both';
  if (lower === 'false') return 'neither';
  if (["men's", "women's", 'both', 'neither'].includes(lower)) return lower;
  return 'neither';
}

async function importParks() {
  const parks = [];
  let isFirstRow = true;
  const rowProcessingPromises = [];

  const processRow = async (row) => {
    try {
      if (isFirstRow) {
        isFirstRow = false;
      }

      // Skip rows missing key fields.
      if (!row.Name || !row.Address || !row.City || !row.State) {
        console.warn('Skipping row with missing fields:', JSON.stringify(row, null, 2));
        return;
      }

      const validFieldTypes = ['baseball', 'softball', 'both', 't-ball'];
      const validOutfieldMaterials = ['grass', 'turf'];
      const validInfieldMaterials = ['grass', 'dirt'];
      const validMoundTypes = ['dirt', 'turf', 'portable'];
      const validBackstopMaterials = ['fence', 'net'];
      const validDugoutMaterials = ['brick', 'fence', 'wood'];
      const validSpectatorSurfaces = ['grass', 'cement', 'gravel', 'dirt'];

      const park = {
        name: row.Name,
        address: normalizeAddress(row.Address),
        city: row.City,
        state: row.State.toUpperCase(),
        coolersAllowed: toBoolean(row['Coolers Allowed?']),
        canopiesAllowed: toBoolean(row['Canopies Allowed?']),
        battingCages: {
          shared: toBoolean(row['Shared Batting Cages?']),
          description: row['Shared Batting Cage Description']?.trim() || null,
        },
        numberOfParkingLots: safeParseInt(row['Number of Parking Lots']),
        rvParkingAvailable: toBoolean(row['RV Parking Available?']),
        bikeRackAvailability: toBoolean(row['Bike Rack Availability?']),
        electricalOutletsForPublicUse: toBoolean(row['Electrical Outlets for Public Use?']),
        stairsDescription: row['Stairs Description'] || null,
        hillsDescription: row['Hills Description'] || null,
        gateEntranceFee: toBoolean(row['Entrance Fee?']),
        otherNotes: row['OTHER NOTES'] || null,
        lights: toBoolean(row['Field Lights?']),
      };

      // Store electrical outlets location as a string and convert sidewalks to Boolean.
      park.electricalOutletsLocation = row['Location of Electrical Outlets']?.trim() || null;
      park.sidewalks = toBoolean(row['Sidewalks']);

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

      park.numberOfFields = safeParseInt(row['Number of Fields']) || 0;
      console.log('Number of fields:', park.numberOfFields);
      park.fields = [];
      for (let i = 1; i <= park.numberOfFields; i++) {
        const field = {
          name: row[`Field ${i} Name`] || null,
          location: row[`Field ${i} Location`] || null,
          fenceDistance: safeParseInt(row[`Field ${i} Fence Distance`]),
          fenceHeight: safeParseInt(row[`Field ${i} Fence Height`]),
          fieldType: normalizeEnumValue(row[`Field ${i} Type`], validFieldTypes),
          outfieldMaterial: normalizeEnumValue(row[`Field ${i} Outfield Material`], validOutfieldMaterials),
          infieldMaterial: normalizeEnumValue(row[`Field ${i} Infield Material`], validInfieldMaterials),
          moundType: normalizeEnumValue(row[`Field ${i} Mound Type`], validMoundTypes),
          fieldShadeDescription: row[`Field ${i} Field Shade Description`] || null,
          parkingDistanceToField: row[`Field ${i} Parking Distance to Field`] || null,
          bleachersAvailable: toBoolean(row[`Field ${i} Bleachers?`]),
          bleachersDescription: row[`Field ${i} Bleachers Description`] || null,
          backstopMaterial: normalizeEnumValue(row[`Field ${i} Backstop Material`], validBackstopMaterials),
          backstopDistance: safeParseInt(row[`Field ${i} Backstop Distance (ft)`]),
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
          handicapSpots: safeParseInt(row['Number of Handicap Spots']) || 0,
        };
      }
      if (row['Park Shade Description']) park.parkShade = row['Park Shade Description'];

      park.restrooms = [];
      if (row['Restroom Location']) {
        park.restrooms.push({
          location: row['Restroom Location'],
          runningWater: toBoolean(row['Restroom Running Water?']),
          changingTable: mapChangingTable(row['Restroom Changing Table?']),
          womensStalls: safeParseInt(row["Women's stalls"]),
          mensStalls: safeParseInt(row["Men's Stalls/Urinals"]),
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
            .filter((s) => validSpectatorSurfaces.includes(s)),
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