// backend/middleware/isTopAdmin.js
const User = require('../models/User');

function buildAllowlist() {
    const raw = process.env.TOP_ADMIN_EMAILS || process.env.SUPER_ADMIN_EMAILS || '';
    return new Set(
        String(raw)
            .split(/[,\s]+/)                // comma or whitespace separated
            .map(e => e.trim().toLowerCase())
            .filter(Boolean)
    );
}

let ALLOW = buildAllowlist();

// Optional: in non-production, refresh allowlist periodically so editing .env and restarting dev server isn't required
if (process.env.NODE_ENV !== 'production') {
    setInterval(() => { ALLOW = buildAllowlist(); }, 30000);
}

module.exports = async function isTopAdmin(req, res, next) {
    try {
        // In dev, skip checks
        if (process.env.NODE_ENV === 'development') return next();

        // 1) Fast-path: allowlisted email in JWT
        const email = (req.user?.email || '').toLowerCase();
        if (email && ALLOW.has(email)) return next();

        // 2) DB fallback: fetch user to double-check adminLevel/email
        let level = req.user?.adminLevel;
        let dbEmail = email;

        if (level === undefined || !dbEmail) {
            const u = await User.findById(req.user?.id).select('adminLevel email');
            level = u?.adminLevel;
            dbEmail = (u?.email || '').toLowerCase();
            if (dbEmail && ALLOW.has(dbEmail)) return next();
        }

        if (Number(level) === 0) return next();

        return res.status(403).json({ message: 'Access denied. Top Admin authorization required.' });
    } catch (err) {
        next(err);
    }
};