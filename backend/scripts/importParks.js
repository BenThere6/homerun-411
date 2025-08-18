// backend/scripts/importParks.js
const path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Park = require('../models/Park');
const { google } = require('googleapis');   // ADD
const http = require('http');               // ADD
const { URL } = require('url');             // ADD
const { PassThrough, Readable } = require('stream'); // ADD

// NEW: source and Drive config
const SOURCE = String(process.env.IMPORT_SOURCE || 'gdrive').toLowerCase(); // 'gdrive' | 'local'
const PARKS_SHEET_NAME = process.env.PARKS_SHEET_NAME || 'Parks';
const PARKS_SHEET_PARENT = process.env.PARKS_SHEET_PARENT || null; // e.g. "HR411 Files"
const PARKS_SHEET_TAB = process.env.PARKS_SHEET_TAB || null; // null = first tab
const SAVE_CSV_SNAPSHOT = String(process.env.SAVE_CSV_SNAPSHOT || 'true').toLowerCase() !== 'false';

// Reuse same locations as your other script
const GDRIVE_CREDENTIALS = path.join(__dirname, '..', 'gdrive.credentials.json');
const GDRIVE_TOKEN = path.join(__dirname, '..', '.gdrive-token.json');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yourDatabaseName';
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY;

// Open default browser (CJS-safe for ESM 'open')
const openBrowser = async (url) => {
  try {
    const m = await import('open');
    await m.default(url);
  } catch {
    const { exec } = require('child_process');
    const cmd =
      process.platform === 'darwin' ? `open "${url}"` :
        process.platform === 'win32' ? `start "" "${url}"` :
          `xdg-open "${url}"`;
    exec(cmd, () => { });
    console.log('\nIf your browser didn’t open, paste this URL manually:\n', url, '\n');
  }
};

async function getDriveClientInteractive() {
  if (!fs.existsSync(GDRIVE_CREDENTIALS)) {
    throw new Error(`Google Drive credentials not found at ${GDRIVE_CREDENTIALS}`);
  }
  const creds = JSON.parse(fs.readFileSync(GDRIVE_CREDENTIALS, 'utf8'));
  const { client_id, client_secret, redirect_uris } = creds.installed || creds.web || {};
  if (!client_id || !client_secret) throw new Error('Invalid gdrive.credentials.json (missing client_id/client_secret).');

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    (redirect_uris && redirect_uris[0]) || 'http://localhost'
  );

  // Use cached token if present
  if (fs.existsSync(GDRIVE_TOKEN)) {
    try {
      const tokens = JSON.parse(fs.readFileSync(GDRIVE_TOKEN, 'utf8'));
      oAuth2Client.setCredentials(tokens);
      return { drive: google.drive({ version: 'v3', auth: oAuth2Client }), sheets: google.sheets({ version: 'v4', auth: oAuth2Client }) };
    } catch { /* fall through */ }
  }

  // First-time: local server captures ?code=...
  const PORT = 43117;
  const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
  const scopes = ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets.readonly'];
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    redirect_uri: REDIRECT,
  });

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const u = new URL(req.url, REDIRECT);
        if (u.pathname !== '/oauth2callback') { res.writeHead(404); res.end('Not Found'); return; }
        const code = u.searchParams.get('code');
        if (!code) { res.writeHead(400); res.end('Missing code'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><p>✅ You can close this window.</p></body></html>');
        server.close(() => resolve(code));
      } catch (e) {
        try { res.writeHead(500); res.end('Error'); } catch { }
        server.close(() => reject(e));
      }
    });
    server.listen(PORT, '127.0.0.1', async () => {
      await openBrowser(authUrl);
      console.log('\nOpened browser to authorize (if it did not open, paste this):\n', authUrl, '\n');
    });
  });

  const { tokens } = await oAuth2Client.getToken({ code, redirect_uri: REDIRECT });
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(GDRIVE_TOKEN, JSON.stringify(tokens, null, 2));
  return { drive: google.drive({ version: 'v3', auth: oAuth2Client }), sheets: google.sheets({ version: 'v4', auth: oAuth2Client }) };
}

async function findSingleFolderByName(drive, name) {
  const q = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `name = '${String(name).replace(/'/g, "\\'")}'`,
  ].join(' and ');

  const res = await drive.files.list({
    q,
    fields: 'files(id,name)',
    pageSize: 5,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });
  return res.data.files?.[0] || null;
}

async function findSingleSheetByName(drive, name, parentName = null) {
  let parent = null;
  if (parentName) {
    parent = await findSingleFolderByName(drive, parentName);
    if (!parent) {
      console.warn(`⚠️ Parent folder "${parentName}" not found; falling back to global search…`);
    }
  }

  const q = [
    "mimeType = 'application/vnd.google-apps.spreadsheet'",
    "trashed = false",
    `name = '${String(name).replace(/'/g, "\\'")}'`,
    parent ? `'${parent.id}' in parents` : null,
  ].filter(Boolean).join(' and ');

  const res = await drive.files.list({
    q,
    fields: 'files(id,name,parents)',
    pageSize: 5,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  return res.data.files?.[0] || null;
}

// Export whole sheet (first tab) as CSV via Drive, or a specific tab via Sheets API
async function getCsvStreamFromSheet({ drive, sheets, fileId, tabName = null }) {
  if (!tabName) {
    // Drive export returns first worksheet as CSV
    const res = await drive.files.export({ fileId, mimeType: 'text/csv' }, { responseType: 'stream' });
    return res.data; // readable stream
  }

  // Specific tab: use Sheets API + build CSV ourselves
  const meta = await sheets.spreadsheets.get({ spreadsheetId: fileId });
  const theSheet = (meta.data.sheets || []).find(s => s.properties?.title === tabName) || meta.data.sheets?.[0];
  const title = theSheet?.properties?.title;
  if (!title) throw new Error('Sheet/tab not found');

  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: fileId, range: `'${title}'` });
  const rows = data.values || [];
  const csvEscape = (cell) => {
    const s = cell == null ? '' : String(cell);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n');
  return Readable.from([csv]); // readable stream
}

async function readCsvStreamToRows(stream) {
  return new Promise((resolve, reject) => {
    const out = [];
    stream
      .pipe(csvParser({ mapHeaders: ({ header }) => String(header || '').trim() }))
      .on('data', (r) => out.push(r))
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

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
      fenceDistance: safeInt(row[`Field ${i} CF Fence Distance`]),
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

  // Spectator notes (free text)
  if (row['Spectator Location Conditions']) {
    park.spectatorConditions = {
      notes: String(row['Spectator Location Conditions']).trim(),
    };
  }

  return park;
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const rows = [];

  if (SOURCE === 'local') {
    const csvPath = path.resolve(__dirname, '../data/parks.csv');
    console.log(`📄 Reading CSV from disk: ${csvPath}`);
    const fileStream = fs.createReadStream(csvPath);
    rows.push(...await readCsvStreamToRows(fileStream));
  } else {
    console.log(`📡 Reading CSV from Google Drive Sheet: "${PARKS_SHEET_NAME}"${PARKS_SHEET_TAB ? ` (tab: ${PARKS_SHEET_TAB})` : ''}${PARKS_SHEET_PARENT ? ` in folder "${PARKS_SHEET_PARENT}"` : ''}`);
    const { drive, sheets } = await getDriveClientInteractive();

    const file = await findSingleSheetByName(drive, PARKS_SHEET_NAME, PARKS_SHEET_PARENT);
    if (!file) throw new Error(`Google Sheet "${PARKS_SHEET_NAME}" not found${PARKS_SHEET_PARENT ? ` in folder "${PARKS_SHEET_PARENT}"` : ''}.`);
    console.log(`🗂️  Found sheet: ${file.name} (id=${file.id})`);

    const csvStream = await getCsvStreamFromSheet({
      drive, sheets, fileId: file.id, tabName: PARKS_SHEET_TAB
    });

    // Optionally tee the CSV stream to a local snapshot
    let parseStream = csvStream;
    if (SAVE_CSV_SNAPSHOT) {
      const outDir = path.resolve(__dirname, '../data');
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, 'parks.drive.csv');
      console.log(`💾 Saving CSV snapshot to: ${outPath}`);
      const tee1 = new PassThrough();
      const tee2 = new PassThrough();
      csvStream.pipe(tee1);
      csvStream.pipe(tee2);
      tee1.pipe(fs.createWriteStream(outPath));
      parseStream = tee2;
    }

    rows.push(...await readCsvStreamToRows(parseStream));
    if (rows.length) {
      const headers = Object.keys(rows[0] || {});
      // console.log(`🧾 Detected headers: ${headers.join(', ')}`);
    }
  }

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
  try { await mongoose.disconnect(); } catch { }
  process.exit(1);
});