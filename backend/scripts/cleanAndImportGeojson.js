// Always load the .env that lives in backend/.env (not the CWD)
require('dotenv').config({
    path: require('path').resolve(__dirname, '..', '.env'),
});
if (!process.env.MONGO_URI) {
    console.error('MONGODB_URI / MONGO_URI is not set (check backend/.env)');
    process.exit(1);
}
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csv-parser');

const Park = require('../models/Park');
const { cleanFeatureCollection } = require('../utils/mapPipeline');

// --- robust paths (always relative to this script) ---
const BASE_DIR = path.join(__dirname, '..');               // .../backend
const DATA_DIR = path.join(BASE_DIR, 'data');              // .../backend/data
const DEFAULT_CSV = path.join(DATA_DIR, 'parks.csv');      // .../backend/data/parks.csv

function resolvePath(p) {
    if (!p) return null;
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

function deriveNameFromPath(p) {
    // "Layton High School.geojson" -> "Layton High School"
    const stem = path.basename(p).replace(/\.[^.]+$/, '');
    // decode %20, handle underscores/dashes to spaces, normalize whitespace
    return decodeURIComponent(stem).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeName(s) {
    if (!s) return '';
    return String(s)
        // Remove everything that's not a letter or digit so
        // "Layton High School", "Layton-High_School", "LaytonHighSchool"
        // all become "laytonhighschool".
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}

function firstGeojsonInDataDir() {
    if (!fs.existsSync(DATA_DIR)) return null;
    const files = fs.readdirSync(DATA_DIR).filter(f => /\.geojson$/i.test(f));
    if (files.length !== 1) return { error: files.length === 0 ? 'none' : 'multiple', files };
    return { path: path.join(DATA_DIR, files[0]) };
}

function readCsv(absCsvPath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(absCsvPath)
            .pipe(csv({
                // Normalize headers: remove BOM, trim
                mapHeaders: ({ header }) => String(header || '').replace(/^\uFEFF/, '').trim(),
                // Trim string values
                mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value),
            }))
            .on('data', (r) => rows.push(r))
            .on('end', () => resolve(rows))
            .on('error', reject);
    });
}

function escRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
    // Usage (all optional now):
    //   node backend/scripts/cleanAndImportGeojson.js
    //   node backend/scripts/cleanAndImportGeojson.js "<parkName>"
    //   node backend/scripts/cleanAndImportGeojson.js "<parkName>" <path/to/file.geojson> [path/to/parks.csv]
    const [, , parkNameArg, geojsonPathArg, csvPathArg] = process.argv;

    // 1) Resolve GeoJSON: explicit arg wins; otherwise auto-pick the only .geojson in backend/data
    let absGeo = geojsonPathArg ? resolvePath(geojsonPathArg) : null;
    if (!absGeo) {
        const pick = firstGeojsonInDataDir();
        if (!pick || pick.error) {
            console.error(
                pick?.error === 'multiple'
                    ? `Found multiple .geojson files in ${DATA_DIR}: ${pick.files.join(', ')}`
                    : `No .geojson files found in ${DATA_DIR}`
            );
            console.error('Pass a file explicitly: <path/to/file.geojson>');
            process.exit(1);
        }
        absGeo = pick.path;
    }
    if (!fs.existsSync(absGeo)) {
        console.error('GeoJSON file not found:', absGeo);
        process.exit(1);
    }

    // 2) Resolve park name: explicit arg wins; otherwise derive from file name
    const derivedName = deriveNameFromPath(absGeo);
    const parkName = (parkNameArg && parkNameArg.trim()) || derivedName;

    // 3) Resolve CSV: explicit path wins; otherwise backend/data/parks.csv
    const absCsv = csvPathArg ? resolvePath(csvPathArg) : DEFAULT_CSV;
    if (!absCsv || !fs.existsSync(absCsv)) {
        console.error('CSV not found:', absCsv || csvPathArg || DEFAULT_CSV);
        console.error('Tip: put your CSV at backend/data/parks.csv or pass a custom path as the 3rd arg.');
        process.exit(1);
    }

    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error('MONGODB_URI / MONGO_URI is not set (check backend/.env)');
        process.exit(1);
    }
    await mongoose.connect(MONGO_URI);

    // 1) Read CSV & find the row by name (case-insensitive exact match, normalized)
    const rows = await readCsv(absCsv);

    // Be tolerant of header capitalization (e.g., "Name" vs "name")
    // Case-insensitive, trim-aware field getter
    const getField = (row, wantKey) => {
        const want = String(wantKey).toLowerCase().trim();
        for (const k of Object.keys(row)) {
            if (String(k).toLowerCase().trim() === want) return row[k];
        }
        return undefined;
    };

    const parkNameNorm = normalizeName(parkName);

    // Build a normalized view of rows so we can compare robustly
    const normalizedRows = rows.map(r => {
        const name = getField(r, 'name');
        const city = getField(r, 'city');
        const state = getField(r, 'state');
        return {
            raw: r,
            name,
            city,
            state,
            nameNorm: normalizeName(name),
            cityNorm: normalizeName(city),
            stateNorm: normalizeName(state),
        };
    });

    // Exact normalized name match
    const matches = normalizedRows.filter(x => x.nameNorm === parkNameNorm);

    if (matches.length === 0) {
        console.error(`No CSV row matched name: "${parkName}" (derived from file)`);
        // Show a few similar names to help
        const similar = normalizedRows
            .filter(x => x.nameNorm.includes(parkNameNorm))
            .slice(0, 10)
            .map(x => `${x.name}${x.city ? `, ${x.city}` : ''}${x.state ? `, ${x.state}` : ''}`);
        if (similar.length) {
            console.error('Did you mean one of:', similar.join(' | '));
        } else {
            console.error(`CSV searched: ${absCsv}`);
        }
        process.exit(1);
    }

    if (matches.length > 1) {
        console.warn(`Multiple CSV rows matched "${parkName}". I will try to use city/state to disambiguate.`);
    }

    // Prefer a row that has city/state if there are duplicates; otherwise first match.
    const rowObj =
        matches.find(x => x.city || x.state) ||
        matches[0];

    // Use the *extracted* values, not the raw row (headers may be "Name", not "name")
    const csvName = rowObj.name;
    const csvCity = rowObj.city;
    const csvState = rowObj.state;

    if (!csvName) {
        console.error('Matched CSV row has no resolvable name. Headers seen:',
            Object.keys(rowObj.raw || {}));
        process.exit(1);
    }

    // 2) Find the park in Mongo by name (+ optional city/state from CSV)
    const q = { name: new RegExp(`^${escRe(csvName)}$`, 'i') };
    if (csvCity) q.city = new RegExp(`^${escRe(csvCity)}$`, 'i');
    if (csvState) q.state = new RegExp(`^${escRe(csvState)}$`, 'i');

    let park = await Park.findOne(q);

    // If still not found, relax to name-only
    if (!park) {
        console.warn('No exact name+city/state match; trying name-only…');
        park = await Park.findOne({ name: new RegExp(`^${escRe(csvName)}$`, 'i') });
    }

    if (!park) {
        console.error(`Park not found in DB by CSV row: name="${csvName}" city="${csvCity || ''}" state="${csvState || ''}"`);
        // Offer similar DB names to help (use derived/filename search term for suggestions)
        const candidates = await Park.find({ name: new RegExp(escRe(parkName), 'i') }).limit(10);
        if (candidates.length) {
            console.error('DB had similar names:', candidates.map(p => `${p.name}${p.city ? `, ${p.city}` : ''}${p.state ? `, ${p.state}` : ''} (${p._id})`).join(' | '));
        }
        process.exit(1);
    }

    // 3) Load & clean GeoJSON
    const raw = JSON.parse(fs.readFileSync(absGeo, 'utf8'));
    const cleaned = cleanFeatureCollection(raw);

    // 4) Save to park.mapFeatures
    park.mapFeatures = cleaned;
    await park.save();

    console.log(`✅ Imported ${cleaned.features.length} features to park ${park.name} (${park._id})`);
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });