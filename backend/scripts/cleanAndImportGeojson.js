#!/usr/bin/env node
/* eslint-disable no-console */

// Always load the .env that lives in backend/.env (not the CWD)
require('dotenv').config({
    path: require('path').resolve(__dirname, '..', '.env'),
});

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const { google } = require('googleapis');
const http = require('http');
const { URL } = require('url');

const Park = require('../models/Park');
const { cleanFeatureCollection } = require('../utils/mapPipeline');

/* ------------------------------ CLI parsing ------------------------------ */

function parseArgs(argv) {
    const opts = {};
    const positional = [];
    for (const a of argv.slice(2)) {
        if (a.startsWith('--')) {
            const [k, v] = a.replace(/^--/, '').split('=');
            opts[k] = v ?? true;
        } else {
            positional.push(a);
        }
    }
    return { opts, positional };
}
const { opts, positional } = parseArgs(process.argv);

// Open the consent URL in the default browser (CJS-safe for ESM 'open' package)
const openBrowser = async (url) => {
    try {
        const m = await import('open');      // ESM dynamic import
        await m.default(url);
    } catch {
        // Fallback to OS launcher
        const { exec } = require('child_process');
        const cmd =
            process.platform === 'darwin' ? `open "${url}"` :
                process.platform === 'win32' ? `start "" "${url}"` :
                    `xdg-open "${url}"`;
        exec(cmd, () => { });
        console.log('\nIf your browser didn’t open, paste this URL manually:\n', url, '\n');
    }
};

// Which field to replace
const MODE = String(opts.mode || 'park').toLowerCase(); // 'park' | 'nearby'
if (!['park', 'nearby'].includes(MODE)) {
    console.error(`--mode must be "park" or "nearby" (got ${MODE})`);
    process.exit(1);
}

// Where to read the GeoJSON from (default: gdrive; can override via flag or .env)
const SOURCE = String(opts.source || process.env.IMPORT_SOURCE || 'gdrive').toLowerCase(); // 'gdrive' | 'local'

/* ------------------------------ Paths & IO ------------------------------- */

const BASE_DIR = path.join(__dirname, '..');               // .../backend
const DATA_DIR = path.join(BASE_DIR, 'data');              // .../backend/data
const DEFAULT_CSV = path.join(DATA_DIR, 'parks.drive.csv');      // .../backend/data/parks.csv
const GDRIVE_CREDENTIALS = path.join(BASE_DIR, 'gdrive.credentials.json');
const GDRIVE_TOKEN = path.join(BASE_DIR, '.gdrive-token.json');

function resolvePath(p) {
    if (!p) return null;
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

function deriveNameFromPath(p) {
    const stem = path.basename(p).replace(/\.[^.]+$/, '');
    return decodeURIComponent(stem).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeName(s) {
    if (!s) return '';
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
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
                mapHeaders: ({ header }) => String(header || '').replace(/^\uFEFF/, '').trim(),
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

/* --------------------------- Google Drive utils -------------------------- */
async function getDriveClientInteractive() {
    // Load Desktop OAuth client (downloaded JSON)
    if (!fs.existsSync(GDRIVE_CREDENTIALS)) {
        console.error(`Google Drive credentials not found at ${GDRIVE_CREDENTIALS}
  Create an OAuth "Desktop" client in Google Cloud and save the JSON there.`);
        process.exit(1);
    }
    const creds = JSON.parse(fs.readFileSync(GDRIVE_CREDENTIALS, 'utf8'));
    const { client_id, client_secret, redirect_uris } = creds.installed || creds.web || {};
    if (!client_id || !client_secret) {
        console.error('Invalid gdrive.credentials.json (missing client_id/client_secret).');
        process.exit(1);
    }

    // Desktop clients support http://localhost as redirect; we’ll use a specific port
    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        (redirect_uris && redirect_uris[0]) || 'http://localhost'
    );

    // If we already have a refresh token, use it silently
    if (fs.existsSync(GDRIVE_TOKEN)) {
        try {
            const tokens = JSON.parse(fs.readFileSync(GDRIVE_TOKEN, 'utf8'));
            oAuth2Client.setCredentials(tokens);
            return google.drive({ version: 'v3', auth: oAuth2Client });
        } catch (_) { /* fall through to interactive */ }
    }

    // First-time interactive auth (no copy-paste): local server captures ?code=...
    const PORT = 43117;
    const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
    const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',        // ensure refresh_token on first run
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
    return google.drive({ version: 'v3', auth: oAuth2Client });
}

async function promptPickWithAll(title, items, labelFn = x => x) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(`\n${title}`);
    items.forEach((it, i) => console.log(`  [${i + 1}] ${labelFn(it)}`));
    console.log('  [0] All');
    const answer = await new Promise(res =>
        rl.question('\nChoose a number: ', a => { rl.close(); res(String(a || '').trim()); })
    );
    if (answer === '0' || /^all$/i.test(answer)) return { all: true };
    const idx = parseInt(answer, 10) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= items.length) {
        console.error('Invalid selection.');
        process.exit(1);
    }
    return { item: items[idx] };
}

async function pickGeojsonsFromDriveAll() {
    const drive = await getDriveClientInteractive();

    console.log('\n🔎 Scanning Drive: HR411 Files / Park Maps (All)…');

    // HR411 Files / Park Maps
    const hrFolder = await findSingleFolderByName(drive, 'HR411 Files');
    if (!hrFolder) { console.error('Folder "HR411 Files" not found'); process.exit(1); }
    const mapsFolder = await findSingleFolderByName(drive, 'Park Maps', hrFolder.id);
    if (!mapsFolder) { console.error('Folder "Park Maps" not found under "HR411 Files"'); process.exit(1); }

    const children = await listChildren(drive, mapsFolder.id);
    const parkFolders = children.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    if (!parkFolders.length) { console.error('No park folders found under "Park Maps".'); process.exit(1); }

    const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

    const picks = [];
    for (const folder of parkFolders) {
        console.log(`  • Folder: ${folder.name}`);
        const files = await listChildren(drive, folder.id);
        const geojsons = files.filter(f => /\.geojson$/i.test(f.name));
        if (!geojsons.length) {
            console.warn(`    ↳ (skip) no .geojson in this folder`);
            continue;
        }
        const preferred =
            geojsons.find(f => norm(f.name.replace(/\.geojson$/i, '')) === norm(folder.name)) ||
            geojsons[0];

        console.log(`    ↳ Using file: ${preferred.name}`);
        try {
            const res = await drive.files.get(
                { fileId: preferred.id, alt: 'media' },
                { responseType: 'arraybuffer' }
            );
            const buf = Buffer.from(res.data);
            const json = JSON.parse(buf.toString('utf8'));
            const count = Array.isArray(json?.features) ? json.features.length : 0;
            console.log(`      · Downloaded (${count} features)`);
            picks.push({ parkName: folder.name, geojsonObject: json, displayName: preferred.name });
        } catch (e) {
            console.warn(`    ✗ Download failed: ${e.message}`);
        }
    }
    console.log(`\n🧾 Prepared ${picks.length} import item(s).\n`);
    return picks;
}

async function findSingleFolderByName(drive, name, parentId = null) {
    const q = [
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
        `name = '${name.replace(/'/g, "\\'")}'`,
        parentId ? `'${parentId}' in parents` : null,
    ].filter(Boolean).join(' and ');
    const res = await drive.files.list({
        q,
        fields: 'files(id,name,driveId)',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
    });
    return res.data.files?.[0] || null;
}

async function listChildren(drive, parentId) {
    const res = await drive.files.list({
        q: [`'${parentId}' in parents`, 'trashed = false'].join(' and '),
        fields: 'files(id,name,mimeType,driveId)',
        pageSize: 200,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
    });
    return res.data.files || [];
}

async function promptPick(title, items, labelFn = x => x) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(`\n${title}`);
    items.forEach((it, i) => console.log(`  [${i + 1}] ${labelFn(it)}`));
    const answer = await new Promise(res => rl.question('\nChoose a number: ', a => { rl.close(); res(a); }));
    const idx = parseInt(answer, 10) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= items.length) {
        console.error('Invalid selection.');
        process.exit(1);
    }
    return items[idx];
}

async function pickGeojsonFromDrive(allowAll = true) {
    const drive = await getDriveClientInteractive();

    // Navigate HR411 Files / Park Maps
    const hrFolder = await findSingleFolderByName(drive, 'HR411 Files');
    if (!hrFolder) { console.error('Folder "HR411 Files" not found'); process.exit(1); }
    const mapsFolder = await findSingleFolderByName(drive, 'Park Maps', hrFolder.id);
    if (!mapsFolder) { console.error('Folder "Park Maps" not found under "HR411 Files"'); process.exit(1); }

    // Pick a park folder (or All)
    const children = await listChildren(drive, mapsFolder.id);
    const parkFolders = children.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    if (!parkFolders.length) { console.error('No park folders found under "Park Maps".'); process.exit(1); }

    let pickedFolder;
    if (allowAll) {
        const choice = await promptPickWithAll('Pick a park folder:', parkFolders, f => f.name);
        if (choice.all) {
            // Return an array of picks (same shape used elsewhere)
            return await pickGeojsonsFromDriveAll();
        }
        pickedFolder = choice.item;
    } else {
        pickedFolder = await promptPick('Pick a park folder:', parkFolders, f => f.name);
    }

    const parkName = pickedFolder.name;

    // Pick a .geojson in that folder
    const files = await listChildren(drive, pickedFolder.id);
    const geojsons = files.filter(f => /\.geojson$/i.test(f.name));
    if (!geojsons.length) { console.error(`No .geojson files found in "${parkName}".`); process.exit(1); }

    const pickedFile = geojsons.length === 1
        ? geojsons[0]
        : await promptPick(`Pick a GeoJSON in "${parkName}":`, geojsons, f => f.name);

    // Download file content
    const res = await drive.files.get({ fileId: pickedFile.id, alt: 'media' }, { responseType: 'arraybuffer' });
    const buf = Buffer.from(res.data);
    const json = JSON.parse(buf.toString('utf8'));

    return { parkName, geojsonObject: json, displayName: pickedFile.name };
}

/* ---------------------------- Nearby transformer ------------------------- */
/** Convert a GeoJSON FeatureCollection of Points into the nearbyAmenities shape */
function geojsonToNearbyAmenities(fc) {
    const out = [];
    for (const f of (fc?.features || [])) {
        if (!f?.geometry || f.geometry.type !== 'Point') continue;
        const [lng, lat] = f.geometry.coordinates || [];
        if (lat == null || lng == null) continue;

        const p = f.properties || {};
        const cats = []
            .concat(p.categories || p.types || p.kind || p.layer || [])
            .flat()
            .filter(Boolean)
            .map(String);

        out.push({
            placeId: p.placeId || p.id || p.objectid || `local_${Math.random().toString(36).slice(2, 10)}`,
            name: p.name || p.title || 'POI',
            categories: cats.length ? cats : ['poi'],
            location: { lat, lng },
            rating: p.rating || undefined,
            priceLevel: p.priceLevel || p.price_level || undefined,
        });
    }
    return out;
}

/* --------------------------------- Main ---------------------------------- */

async function main() {
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error('MONGODB_URI / MONGO_URI is not set (check backend/.env)');
        process.exit(1);
    }
    await mongoose.connect(MONGO_URI);

    // Resolve input source into a list of { parkName, geojsonObject, displayName }
    let parkNameArg = positional[0];
    let geojsonPathArg = positional[1];
    const csvPathArg = positional[2];

    let picks = [];

    if (SOURCE === 'gdrive') {
        if (opts.all) {
            picks = await pickGeojsonsFromDriveAll();
            console.log(`\n📦 Found ${picks.length} park(s) to import from Drive\n`);
            if (!picks.length) process.exit(1);
        } else {
            const pick = await pickGeojsonFromDrive(true); // show "[0] All" in the prompt
            if (Array.isArray(pick)) {
                picks = pick;
                console.log(`\n📦 Found ${picks.length} park(s) to import from Drive (All)\n`);
            } else {
                console.log(`\n📁 Selected park: ${pick.parkName}\n📄 Selected file: ${pick.displayName}`);
                picks = [pick];
            }
        }
    } else {
        // Local file path resolution (backward compatible)
        let absCsvTmp = csvPathArg ? resolvePath(csvPathArg) : DEFAULT_CSV;
        if (!absCsvTmp || !fs.existsSync(absCsvTmp)) {
            console.error('CSV not found:', absCsvTmp || csvPathArg || DEFAULT_CSV);
            process.exit(1);
        }

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

        // read JSON
        const geojsonObject = JSON.parse(fs.readFileSync(absGeo, 'utf8'));
        picks = [{ parkName, geojsonObject, displayName: path.basename(absGeo) }];
    }

    // Print the import plan
    console.log('🧭 Import plan:');
    picks.forEach((p, i) => {
        const n = Array.isArray(p.geojsonObject?.features) ? p.geojsonObject.features.length : 0;
        console.log(`  ${i + 1}. ${p.parkName} — ${p.displayName} (${n} features)`);
    });

    // 3) Resolve CSV path once
    const absCsv = resolvePath(csvPathArg || DEFAULT_CSV);
    if (!absCsv || !fs.existsSync(absCsv)) {
        console.error('CSV not found:', absCsv || csvPathArg || DEFAULT_CSV);
        process.exit(1);
    }

    // 4) Read CSV once, prep a normalized view
    const rows = await readCsv(absCsv);
    const getField = (row, wantKey) => {
        const want = String(wantKey).toLowerCase().trim();
        for (const k of Object.keys(row)) {
            if (String(k).toLowerCase().trim() === want) return row[k];
        }
        return undefined;
    };
    const normalizeNameLocal = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const escReLocal = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const normalizedRows = rows.map(r => ({
        raw: r,
        name: getField(r, 'name'),
        city: getField(r, 'city'),
        state: getField(r, 'state'),
        nameNorm: normalizeNameLocal(getField(r, 'name')),
    }));

    // --- Import loop (handles 1 or many) ---
    const summary = { updated: 0, added: 0, skipped: 0, errors: 0 };

    for (const [idx, pick] of picks.entries()) {
        const { parkName, geojsonObject, displayName } = pick || {};
        console.log(`\n——— [${idx + 1}/${picks.length}] ${parkName || '(missing name)'} — ${displayName || '(no filename)'} ———`);

        if (!parkName) {
            console.warn('• Selection had no parkName (this usually indicates a bad pick). Action: skip.');
            summary.skipped++;
            continue;
        }

        const parkNameNorm = normalizeNameLocal(parkName);
        console.log(`• CSV match: name="${parkName}" (normalized="${parkNameNorm}")`);

        // CSV match by normalized name (prefer entries with city/state if dupes)
        const matches = normalizedRows.filter(x => x.nameNorm === parkNameNorm);
        console.log(`  ↳ CSV matches found: ${matches.length}`);
        if (!matches.length) {
            console.warn(`  ↳ No CSV row matched. Action: skip.\n    Tip: add a row to ${absCsv} with Name exactly "${parkName}".`);
            summary.skipped++;
            continue;
        }
        const rowObj = matches.find(x => x.city || x.state) || matches[0];
        const csvName = rowObj.name;
        const csvCity = rowObj.city;
        const csvState = rowObj.state;
        if (!csvName) {
            console.warn('  ↳ Matched row has no resolvable Name header. Action: skip.');
            summary.skipped++;
            continue;
        }
        console.log(`• CSV resolved → name="${csvName}"${csvCity ? `, city="${csvCity}"` : ''}${csvState ? `, state="${csvState}"` : ''}`);

        // Find Park doc
        const q = { name: new RegExp(`^${escReLocal(csvName)}$`, 'i') };
        if (csvCity) q.city = new RegExp(`^${escReLocal(csvCity)}$`, 'i');
        if (csvState) q.state = new RegExp(`^${escReLocal(csvState)}$`, 'i');

        let park = await Park.findOne(q);
        if (!park) {
            park = await Park.findOne({ name: new RegExp(`^${escReLocal(csvName)}$`, 'i') });
        }

        if (!park) {
            console.warn('• DB lookup: not found. Action: skip.');
            console.warn('  Tip: create the park in Mongo (and ensure CSV row exists) before importing geometry.');
            summary.skipped++;
            continue;
        }
        console.log(`• DB lookup: found park "${park.name}" (_id=${park._id})`);

        try {
            if (MODE === 'park') {
                const sourceCount = Array.isArray(geojsonObject?.features) ? geojsonObject.features.length : 0;
                const prev = Array.isArray(park.mapFeatures?.features) ? park.mapFeatures.features.length : 0;

                const cleaned = cleanFeatureCollection(geojsonObject);
                park.mapFeatures = cleaned;
                const next = Array.isArray(cleaned?.features) ? cleaned.features.length : 0;

                const addedNow = prev === 0 && next > 0;
                console.log(`• Update: mapFeatures ${prev} → ${next} (source had ${sourceCount})`);

                await park.save();
                summary[addedNow ? 'added' : 'updated']++;
            } else {
                const prev = Array.isArray(park.nearbyAmenities) ? park.nearbyAmenities.length : 0;

                const nearby = geojsonToNearbyAmenities(geojsonObject);
                const next = Array.isArray(nearby) ? nearby.length : 0;
                park.nearbyAmenities = nearby;

                const addedNow = prev === 0 && next > 0;
                console.log(`• Update: nearbyAmenities ${prev} → ${next}`);

                await park.save();
                summary[addedNow ? 'added' : 'updated']++;
            }
            console.log('✔ Saved.');
        } catch (e) {
            console.warn(`✗ Error saving: ${e.message}`);
            summary.errors++;
        }
    }

    console.log(`\n✅ Done. Updated: ${summary.updated}, Added: ${summary.added}, Skipped: ${summary.skipped}, Errors: ${summary.errors}`);
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });  