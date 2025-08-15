function titleCase(s) {
    return s.replace(/\s+/g, ' ').trim()
        .toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function inferKind(name, props = {}) {
    const n = (name || '').toLowerCase();
    if (n.includes('handicap')) return 'handicap_parking';
    if (n.includes('parking') && n.includes('entrance')) return 'parking_entrance';
    if (n.includes('parking')) return 'parking';
    if (n.includes('restroom') || n.includes('toilet') || n.includes('bathroom')) return 'restroom';
    if (n.includes('concession') || n.includes('snack')) return 'concession';
    if (n.includes('playground')) return 'playground';
    if (n.includes('bullpen')) return 'bullpen';
    if (n.includes('batting')) return 'batting_cage';
    if (n.includes('distance')) return 'distance_marker';
    if (n.includes('boundary')) return 'boundary';
    if (n.includes('field') || n.includes('diamond') || n.includes('softball') || n.includes('baseball') || n.includes('football')) return 'field';
    // folder/layer fallback if present:
    const folder = (props.folderName || props.parentLayer || '').toLowerCase();
    if (folder) return inferKind(folder);
    return 'field';
}

function inferLod(kind) {
    return (kind === 'parking' || kind === 'parking_entrance' || kind === 'boundary' || kind === 'playground')
        ? 'overview'
        : 'detail';
}

function centroid(geom) {
    const t = geom?.type, c = geom?.coordinates;
    if (t === 'Point') return { lat: c[1], lng: c[0] };
    if (t === 'LineString') { const mid = Math.floor(c.length / 2); return { lat: c[mid][1], lng: c[mid][0] }; }
    if (t === 'Polygon') {
        const ring = c[0]; let x = 0, y = 0; for (const [lng, lat] of ring) { x += lng; y += lat; }
        const n = ring.length; return { lat: y / n, lng: x / n };
    }
    return null;
}

function haversineMeters(a, b) {
    const toRad = d => d * Math.PI / 180, R = 6371000;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

function cleanFeatureCollection(fc) {
    const out = [];
    for (const f of (fc.features || [])) {
        if (!f.geometry) continue;
        const rawName = (f.properties?.name || '').trim();
        if (!rawName) continue;
        const name = titleCase(rawName);
        const kind = f.properties?.kind || inferKind(name, f.properties);
        const lod = f.properties?.lod || inferLod(kind);

        out.push({
            type: 'Feature',
            geometry: f.geometry,
            properties: {
                id: f.properties?.id || `id_${Math.random().toString(36).slice(2, 10)}`,
                name,
                normName: name.toLowerCase(),
                kind, lod
            }
        });
    }

    // dedupe same kind+name within 50 m
    const deduped = [];
    for (const f of out) {
        const c1 = centroid(f.geometry);
        const dup = deduped.find(g =>
            g.properties.kind === f.properties.kind &&
            g.properties.normName === f.properties.normName &&
            c1 && (() => { const c2 = centroid(g.geometry); return c2 && haversineMeters(c1, c2) < 50; })()
        );
        if (!dup) deduped.push(f);
    }

    return { type: 'FeatureCollection', features: deduped };
}

// --- Google Places ingest (server-side) ---
const fetch = require('node-fetch');
async function fetchNearby({ lat, lng, radius = 1500 }) {
    const key = process.env.GOOGLE_PLACES_WEB_KEY;
    const TYPES = ['restaurant', 'fast_food', 'gas_station', 'supermarket'];
    const results = [];

    for (const type of TYPES) {
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${key}`;
        for (let page = 0; page < 2; page++) { // grab up to ~40 per type
            const res = await fetch(url); const json = await res.json();
            (json.results || []).forEach(p => results.push({
                placeId: p.place_id,
                name: p.name,
                categories: p.types || [],
                location: { lat: p.geometry.location.lat, lng: p.geometry.location.lng },
                rating: p.rating, priceLevel: p.price_level,
            }));
            if (!json.next_page_token) break;
            await new Promise(r => setTimeout(r, 2000));
            url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${json.next_page_token}&key=${key}`;
        }
    }

    // compute distanceMeters later when you save with park coords, or here if you pass lat/lng.
    return results;
}

module.exports = { cleanFeatureCollection, fetchNearby };