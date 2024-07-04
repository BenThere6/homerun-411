const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // 1. Retrieve token from Authorization header
  const token = req.header('Authorization');

  // 2. Check if token is present
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // 3. Verify the token using JWT_SECRET from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach decoded user information to request object
    req.user = decoded.user;

    // 5. Proceed to the next middleware or route handler
    next();
  } catch (err) {
    // 6. Handle token verification errors
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticate;