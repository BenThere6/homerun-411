const isTopAdmin = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        // Allow all requests in development mode
        return next();
    }

    // Check if the user is a Top Admin (adminLevel 0)
    if (req.user.adminLevel !== 0) {
        return res.status(403).json({ message: 'Access denied. Top Admin authorization required.' });
    }

    // Allow the request to proceed
    next();
};

module.exports = isTopAdmin;