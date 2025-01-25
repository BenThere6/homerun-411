const isAdmin = (req, res, next) => {
    // Check if environment is development
    if (process.env.NODE_ENV === 'development') {
        // Allow all requests in development mode
        return next();
    }

    // Check if the user has admin privileges (adminLevel 0 or 1)
    if (req.user.adminLevel === undefined || req.user.adminLevel > 1) {
        return res.status(403).json({ message: 'Access denied. Admin authorization required.' });
    }

    // Allow the request to proceed
    next();
};

module.exports = isAdmin;