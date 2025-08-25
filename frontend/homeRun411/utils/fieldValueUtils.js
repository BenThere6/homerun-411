// utils/fieldValueUtils.js

// ---- Text normalization helpers ----
export function normalizeText(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replace(/\s+/g, ' ').toLowerCase();
    return s || null;
}

export function titleCase(raw) {
    if (raw == null) return '';
    const s = String(raw).trim().replace(/\s+/g, ' ');
    return s
        .toLowerCase()
        .replace(/\b([a-z])/g, (m, c) => c.toUpperCase())
        .replace(/\bFt\b/gi, 'ft'); // keep 'ft' lowercase
}

// ---- Boolean-ish detection/formatting ----
const TRUE_WORDS = new Set(['yes', 'y', 'true', 't', '1', 'on']);
const FALSE_WORDS = new Set(['no', 'n', 'false', 'f', '0', 'off']);

export function parseBooleanish(raw) {
    const n = normalizeText(raw);
    if (!n) return null;
    if (TRUE_WORDS.has(n)) return true;
    if (FALSE_WORDS.has(n)) return false;
    return null;
}

export function formatBoolean(b) {
    if (b === true) return 'Yes';
    if (b === false) return 'No';
    return '—';
}

// ---- Number extraction ----
// Returns the FIRST number it finds in the string. "12-14 ft" -> 12
// "400'" -> 400, "3.5 in" -> 3.5
export function extractNumber(raw) {
    if (raw == null) return null;
    const s = String(raw);
    const m = s.match(/-?\d+(\.\d+)?/);
    return m ? Number(m[0]) : null;
}

// Heuristic: does the original text look like a feet measurement?
export function looksLikeFeet(raw) {
    if (raw == null) return false;
    return /\b(ft|feet|foot|')\b/i.test(String(raw));
}

// ---- Display formatting ----
export function fmtFeet(n) {
    if (n == null || Number.isNaN(n)) return '—';
    return `${Math.round(n)} ft`;
}

export function fmtNumber(n) {
    if (n == null || Number.isNaN(n)) return '—';
    const r = Math.round(Number(n) * 100) / 100;
    return String(r);
}

export function fmtText(raw) {
    if (raw == null || String(raw).trim() === '') return '—';
    return titleCase(String(raw));
}

// Value -> human display, using hints from the raw string
export function toDisplay(raw) {
    if (raw == null || String(raw).trim() === '') return '—';

    // boolean?
    const b = parseBooleanish(raw);
    if (b !== null) return formatBoolean(b);

    // numeric?
    const num = extractNumber(raw);
    if (num !== null) {
        if (looksLikeFeet(raw)) return fmtFeet(num);
        return fmtNumber(num);
    }

    // fallback text
    return fmtText(raw);
}

// ---- Numeric clustering (tolerance-aware) ----
// Cluster numbers so near-equals count together. Returns:
// { clusters: Array<{center:number, items:[{fieldName, raw, num}]}> }
export function clusterNumeric(items, { absTol = 5, pctTol = 0.02 } = {}) {
    // items: [{ fieldName, raw, num }]
    const sorted = items.filter(x => typeof x.num === 'number' && !Number.isNaN(x.num))
        .sort((a, b) => a.num - b.num);

    const clusters = [];
    for (const it of sorted) {
        const tol = Math.max(absTol, Math.abs(it.num) * pctTol);

        // try to place in existing cluster (within tol of cluster center)
        let placed = false;
        for (const cl of clusters) {
            const delta = Math.abs(it.num - cl.center);
            if (delta <= tol) {
                cl.items.push(it);
                // update center to median for stability
                const nums = cl.items.map(x => x.num).sort((a, b) => a - b);
                const mid = Math.floor(nums.length / 2);
                cl.center = nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
                placed = true;
                break;
            }
        }
        if (!placed) {
            clusters.push({ center: it.num, items: [it] });
        }
    }

    return { clusters };
}

// Given original raw string + numeric center, pick a nice display for the cluster center
export function displayClusterCenter(center, sampleRaw) {
    if (looksLikeFeet(sampleRaw)) return fmtFeet(center);
    return fmtNumber(center);
}
