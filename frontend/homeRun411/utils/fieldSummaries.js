// utils/fieldSummaries.js
import {
    extractNumber,
    normalizeText,
    toDisplay,
    clusterNumeric,
    displayClusterCenter,
    titleCase,
} from './fieldValueUtils';

// --- Keys we should skip when auto-discovering attributes ---
const IGNORE_KEYS = new Set([
    'id', '_id', 'uuid',
    'name', 'fieldName', 'label',
    'createdAt', 'updatedAt', '__v',
    'fenceDistance', // legacy single distance (we map it to CF below)
]);

function isIgnorableKey(k) {
    if (!k) return true;
    const s = String(k).trim();
    if (s === '') return true;
    if (IGNORE_KEYS.has(s)) return true;
    return false;
}

// Convert "fenceCenter" → "Fence Center", "fence_center" → "Fence Center", etc.
export function humanizeKey(k = '') {
    const spaced = String(k)
        .replace(/[_\-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
    return titleCase(spaced);
}

// Heuristic grouping for sections
export function groupForKey(k = '') {
    const s = String(k).toLowerCase();

    if (
        /infield|outfield|surface|mound|dugout|turf|grass/.test(s)
    ) return 'Surfaces';

    if (
        /fence|height|distance|baseline|backstop|radius|width|length|diameter|depth/.test(s)
    ) return 'Dimensions';

    if (
        /light|bleacher|scoreboard|net|bullpen|cage|amenit/.test(s)
    ) return 'Amenities';

    return 'Other';
}

const GROUP_ORDER = ['Surfaces', 'Dimensions', 'Amenities', 'Other'];

// Summarize a single attribute across fields.
// Returns null if the attribute is missing for all fields.
export function summarizeAttribute(attrKey, fields, {
    absTol = 5,         // feet tolerance for numeric clustering
    pctTol = 0.02,      // ±2% also considered
    tolByKey = {},
    dominanceThreshold = 0.65,
} = {}) {
    const keyTol = tolByKey?.[attrKey] || {};
    const effAbsTol = Number.isFinite(keyTol.absTol) ? keyTol.absTol : absTol;
    const effPctTol = Number.isFinite(keyTol.pctTol) ? keyTol.pctTol : pctTol;

    if (!Array.isArray(fields) || fields.length === 0) return null;

    // Collect raw values per field
    const items = fields.map((f, idx) => {
        const fieldName = f?.name || `Field ${idx + 1}`;
        const raw = f?.[attrKey];
        return { fieldName, raw };
    });

    const presentItems = items.filter(it => it.raw != null && String(it.raw).trim() !== '');
    const presentCount = presentItems.length;

    if (presentCount === 0) return null; // all missing -> skip row

    // Decide if we should treat as numeric: at least 2 fields with a parsable number.
    const numericCandidates = presentItems
        .map(it => ({ ...it, num: extractNumber(it.raw) }))
        .filter(it => typeof it.num === 'number' && !Number.isNaN(it.num));

    if (numericCandidates.length >= 2) {
        const { clusters } = clusterNumeric(numericCandidates, { absTol: effAbsTol, pctTol: effPctTol });

        let maxSize = 0, mainClusterIdx = -1;
        clusters.forEach((cl, i) => {
            if (cl.items.length > maxSize) { maxSize = cl.items.length; mainClusterIdx = i; }
        });

        const topSizes = clusters.map(cl => cl.items.length).sort((a, b) => b - a);
        const tieLargest = topSizes.length >= 2 && topSizes[0] === topSizes[1];

        const hasDominant = mainClusterIdx >= 0 && (maxSize / presentCount) >= dominanceThreshold;

        if (!hasDominant || tieLargest) {
            // No dominant value at ≥65% -> treat as "Varies by field"
            const subtextList = presentItems.map(it => ({ fieldName: it.fieldName, display: toDisplay(it.raw) }));
            return {
                key: attrKey, title: humanizeKey(attrKey), type: 'numeric', group: groupForKey(attrKey),
                tieAllDifferent: true, commonValueDisplay: 'Varies by field', exceptions: subtextList
            };
        }

        const mainCluster = clusters[mainClusterIdx];
        const representativeRaw = mainCluster.items[0]?.raw ?? presentItems[0]?.raw;
        const commonValueDisplay = displayClusterCenter(mainCluster.center, representativeRaw);

        const mainSet = new Set(mainCluster.items.map(it => it.fieldName));
        const exceptions = presentItems
            .filter(it => !mainSet.has(it.fieldName))
            .map(it => ({ fieldName: it.fieldName, display: toDisplay(it.raw) }));

        return {
            key: attrKey, title: humanizeKey(attrKey), type: 'numeric', group: groupForKey(attrKey),
            tieAllDifferent: false, commonValueDisplay, exceptions
        };
    }

    // Text path (mode with outliers) with dominance threshold
    const presentText = presentItems.map(it => ({ ...it, norm: normalizeText(it.raw) || '' }));

    // Count frequencies of normalized text
    const freq = new Map();
    for (const it of presentText) {
        freq.set(it.norm, (freq.get(it.norm) || 0) + 1);
    }
    if (freq.size === 0) return null; // defensive

    // Find top frequency
    let topNorm = null;
    let topCount = 0;
    for (const [norm, count] of freq.entries()) {
        if (count > topCount) {
            topCount = count;
            topNorm = norm;
        }
    }
    const countsSorted = Array.from(freq.values()).sort((a, b) => b - a);
    const isTieTop = countsSorted.length >= 2 && countsSorted[0] === countsSorted[1];
    const hasDominant = !isTieTop && (topCount / presentText.length) >= dominanceThreshold;

    if (!hasDominant) {
        // No dominant value at the required threshold → list all present values
        const subtextList = presentText.map(it => ({
            fieldName: it.fieldName,
            display: toDisplay(it.raw),
        }));
        return {
            key: attrKey,
            title: humanizeKey(attrKey),
            type: 'text',
            group: groupForKey(attrKey),
            tieAllDifferent: true,
            commonValueDisplay: 'Varies by field',
            exceptions: subtextList,
        };
    }

    // Dominant winner exists → common value + exceptions
    const sampleWinner = presentText.find(it => it.norm === topNorm)?.raw ?? topNorm;
    const commonValueDisplay = toDisplay(sampleWinner);

    const exceptions = presentText
        .filter(it => it.norm !== topNorm)
        .map(it => ({ fieldName: it.fieldName, display: toDisplay(it.raw) }));

    return {
        key: attrKey,
        title: humanizeKey(attrKey),
        type: 'text',
        group: groupForKey(attrKey),
        tieAllDifferent: false,
        commonValueDisplay,
        exceptions,
    };
}

// Discover all attribute keys used across fields (minus ignorable ones)
export function discoverAttributeKeys(fields = []) {
    const keys = new Set();
    for (const f of fields) {
        if (!f || typeof f !== 'object') continue;
        for (const k of Object.keys(f)) {
            if (!isIgnorableKey(k)) keys.add(k);
        }
    }
    return Array.from(keys);
}

function normalizeLegacyFieldDistances(f) {
    if (!f || typeof f !== 'object') return f;
    // If old single distance exists and CF is missing, copy it into CF
    if (f.centerFieldDistance == null && f.fenceDistance != null) {
        return { ...f, centerFieldDistance: f.fenceDistance };
    }
    return f;
}

// Build all summaries, grouped & sorted, ready for UI
export function buildSummaries(fields = [], opts = {}) {
    const normFields = Array.isArray(fields) ? fields.map(normalizeLegacyFieldDistances) : [];
    const keys = discoverAttributeKeys(normFields);

    const list = [];
    for (const k of keys) {
        const s = summarizeAttribute(k, normFields, opts);
        if (s) list.push(s);
    }

    // Attach order index for groups
    const orderIndex = new Map(GROUP_ORDER.map((g, i) => [g, i]));

    // Sort by (group order) then (title asc)
    list.sort((a, b) => {
        const ga = orderIndex.has(a.group) ? orderIndex.get(a.group) : 999;
        const gb = orderIndex.has(b.group) ? orderIndex.get(b.group) : 999;
        if (ga !== gb) return ga - gb;
        return a.title.localeCompare(b.title);
    });

    return list;
}
