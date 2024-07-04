const isAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Admin authorization required.' });
    }
    next();
};

module.exports = isAdmin;  