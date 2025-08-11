// backend/scripts/importParks.js
const path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Park = require('../models/Park');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yourDatabaseName';
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY;

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === 'y';
}
function safeInt(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (!s || s === 'nan') return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}
function normalizeAddress(addr) {
  if (!addr) return null;
  return addr
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}
function enumOrNull(v, allowed) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  return allowed.includes(s) ? s : null;
}
function mapChangingTable(v) {
  if (!v) return 'neither';
  const s = String(v).trim().toLowerCase();
  if (s === 'true') return 'both';
  if (s === 'false') return 'neither';
  if (["men's", "women's", 'both', 'neither'].includes(s)) return s;
  return 'neither';
}

// Case-insensitive "duplicate" signature (used in queries)
function dupFilter(doc) {
  return {
    name: doc.name,
    address: doc.address,
    city: doc.city,
    state: doc.state
  };
}

// Geocode with Google
async function geocode(address, city, state) {
  const full = `${address}, ${city}, ${state}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(full)}&key=${GEOCODING_API_KEY}`;
  const { data } = await axios.get(url);
  if (!data.results?.length) return null;
  const { lat, lng } = data.results[0].geometry.location;
  return [lng, lat]; // [lon, lat]
}

async function buildParkFromRow(row) {
  // minimal required fields
  if (!row.Name || !row.Address || !row.City || !row.State) return null;

  const validFieldTypes = ['baseball', 'softball', 'both', 't-ball'];
  const validOutfieldMaterials = ['grass', 'turf'];
  const validInfieldMaterials = ['grass', 'dirt'];
  const validMoundTypes = ['dirt', 'turf', 'portable'];
  const validBackstopMaterials = ['fence', 'net'];
  const validDugoutMaterials = ['brick', 'fence', 'wood'];
  const validSpectatorSurfaces = ['grass', 'cement', 'gravel', 'dirt'];

  const park = {
    name: row.Name.trim(),
    address: normalizeAddress(row.Address),
    city: String(row.City || '').trim(),
    state: String(row.State || '').trim().toUpperCase(),
    coolersAllowed: toBool(row['Coolers Allowed?']),
    canopiesAllowed: toBool(row['Canopies Allowed?']),
    battingCages: {
      shared: toBool(row['Shared Batting Cages?']),
      description: row['Shared Batting Cage Description']?.trim() || null,
    },
    numberOfParkingLots: safeInt(row['Number of Parking Lots']),
    rvParkingAvailable: toBool(row['RV Parking Available?']),
    bikeRackAvailability: toBool(row['Bike Rack Availability?']),
    electricalOutletsForPublicUse: toBool(row['Electrical Outlets for Public Use?']),
    stairsDescription: row['Stairs Description'] || null,
    hillsDescription: row['Hills Description'] || null,
    gateEntranceFee: toBool(row['Entrance Fee?']),
    otherNotes: row['OTHER NOTES'] || null,
    lights: toBool(row['Field Lights?']),
    electricalOutletsLocation: row['Location of Electrical Outlets']?.trim() || null,
    sidewalks: toBool(row['Sidewalks']),
    fields: [],
    restrooms: [],
    concessions: {
      available: String(row['Concessions area'] || '').toUpperCase() === 'TRUE',
      snacks: String(row['Snacks?'] || '').toUpperCase() === 'TRUE',
      drinks: String(row['Drinks?'] || '').toUpperCase() === 'TRUE',
      otherFood: row['Other Food Description'] || null,
      paymentMethods: []
    },
    playground: {
      available: String(row['Playground?'] || '').toUpperCase() === 'TRUE',
      location: row['Playground Location'] || null,
    },
    notes: row['OTHER NOTES'] || null,
  };

  if (row['Cash?']?.toUpperCase() === 'TRUE') park.concessions.paymentMethods.push('cash');
  if (row['Card?']?.toUpperCase() === 'TRUE') park.concessions.paymentMethods.push('card');
  if (row['Venmo?']?.toUpperCase() === 'TRUE') park.concessions.paymentMethods.push('venmo');
  if (row['Tap to pay?']?.toUpperCase() === 'TRUE') park.concessions.paymentMethods.push('tap to pay');

  if (row['Parking Location']) park.closestParkingToField = row['Parking Location'];
  if (row['Number of Handicap Spots']) {
    park.parking = {
      locations: row['Parking Location'] ? [row['Parking Location']] : [],
      handicapSpots: safeInt(row['Number of Handicap Spots']) || 0,
    };
  }
  if (row['Park Shade Description']) park.parkShade = row['Park Shade Description'];

  if (row['Restroom Location']) {
    park.restrooms.push({
      location: row['Restroom Location'],
      runningWater: toBool(row['Restroom Running Water?']),
      changingTable: mapChangingTable(row['Restroom Changing Table?']),
      womensStalls: safeInt(row["Women's stalls"]),
      mensStalls: safeInt(row["Men's Stalls/Urinals"]),
    });
  }

  park.numberOfFields = safeInt(row['Number of Fields']) || 0;
  for (let i = 1; i <= park.numberOfFields; i++) {
    const f = {
      name: row[`Field ${i} Name`] || null,
      location: row[`Field ${i} Location`] || null,
      fenceDistance: safeInt(row[`Field ${i} Fence Distance`]),
      fenceHeight: safeInt(row[`Field ${i} Fence Height`]),
      fieldType: enumOrNull(row[`Field ${i} Type`], validFieldTypes),
      outfieldMaterial: enumOrNull(row[`Field ${i} Outfield Material`], validOutfieldMaterials),
      infieldMaterial: enumOrNull(row[`Field ${i} Infield Material`], validInfieldMaterials),
      moundType: enumOrNull(row[`Field ${i} Mound Type`], validMoundTypes),
      fieldShadeDescription: row[`Field ${i} Field Shade Description`] || null,
      parkingDistanceToField: row[`Field ${i} Parking Distance to Field`] || null,
      bleachersAvailable: toBool(row[`Field ${i} Bleachers?`]),
      bleachersDescription: row[`Field ${i} Bleachers Description`] || null,
      backstopMaterial: enumOrNull(row[`Field ${i} Backstop Material`], validBackstopMaterials),
      backstopDistance: safeInt(row[`Field ${i} Backstop Distance (ft)`]),
      dugoutsCovered: toBool(row[`Field ${i} Dugouts Covered?`]),
      dugoutsMaterial: enumOrNull(row[`Field ${i} Dugouts Material`], validDugoutMaterials),
      scoreboardAvailable: toBool(row[`Field ${i} Scoreboard Available?`]),
      scoreboardType: row[`Field ${i} Scoreboard Type`] || null,
      warningTrack: toBool(row[`Field ${i} Warning Track?`]) || false,
      bullpenAvailable: toBool(row[`Field ${i} Bullpen Available?`]),
      bullpenLocation: row[`Field ${i} Bullpen Location`] || null,
      dugoutCoverageMaterial: row[`Field ${i} Dugout Coverage Material`] || null,
      battingCages: toBool(row[`Field ${i} Batting Cages?`]),
    };
    if (f.name) park.fields.push(f);
  }

  // Geocode
  if (!GEOCODING_API_KEY) throw new Error('GEOCODING_API_KEY missing in .env');
  const coords = await geocode(row.Address, row.City, row.State);
  if (!coords) return null;
  park.coordinates = { type: 'Point', coordinates: coords };

  // Spectator surfaces
  if (row['Spectator Location Conditions']) {
    const validSpectatorSurfaces = ['grass', 'cement', 'gravel', 'dirt'];
    park.spectatorConditions = {
      locationTypes: row['Spectator Location Conditions']
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => validSpectatorSurfaces.includes(s)),
    };
  }

  return park;
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const csvPath = path.resolve(__dirname, '../parks.csv');
  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (r) => rows.push(r))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📄 Read ${rows.length} rows from CSV`);

  const parks = [];
  for (const row of rows) {
    try {
      const park = await buildParkFromRow(row);
      if (park) parks.push(park);
    } catch (e) {
      console.error('Row failed:', e.message);
    }
    // Optional: slow down to be gentle on Geocoding API
    await new Promise(r => setTimeout(r, 150)); // 6–7 req/s
  }

  if (!parks.length) {
    console.warn('No parks to import.');
    await mongoose.disconnect();
    return;
  }

  // Upsert to avoid duplicates (case-insensitive via collation)
  const ops = parks.map(doc => ({
    updateOne: {
      filter: dupFilter(doc),
      update: { $setOnInsert: doc },
      upsert: true
    }
  }));

  const result = await Park.bulkWrite(ops, {
    ordered: false,
    collation: { locale: 'en', strength: 2 } // case-insensitive
  });

  console.log('📦 Import summary:');
  console.log(`  Upserted (new): ${result.upsertedCount || 0}`);
  console.log(`  Matched existing: ${result.matchedCount || 0}`);

  await mongoose.disconnect();
  console.log('✅ Done');
}

run().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});