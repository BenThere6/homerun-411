const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    // Retrieve token from Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if token is present
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using JWT_SECRET from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user information to request object
    // Assuming the payload contains user information directly
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    // Handle token verification errors
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticate;