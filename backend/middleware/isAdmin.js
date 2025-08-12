// middleware/isAdmin.js
const User = require('../models/User');

module.exports = async function isAdmin(req, res, next) {
    try {
        if (process.env.NODE_ENV === 'development') return next();

        let level = req.user?.adminLevel;
        if (level === undefined) {
            const u = await User.findById(req.user.id).select('adminLevel');
            level = u?.adminLevel;
        }

        level = Number(level);
        if (Number.isNaN(level) || level > 1) {
            return res.status(403).json({ message: 'Access denied. Admin authorization required.' });
        }

        req.user.adminLevel = level;
        next();
    } catch (e) {
        next(e);
    }
};