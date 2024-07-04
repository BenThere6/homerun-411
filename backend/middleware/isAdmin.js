const isAdmin = (req, res, next) => {
    // Check if environment is development
    if (process.env.NODE_ENV === 'development') {
        // Allow all requests in development mode
        return next();
    }
    
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Admin authorization required.' });
    }
    next();
};

module.exports = isAdmin;  