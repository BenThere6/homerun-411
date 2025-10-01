const jwt = require('jsonwebtoken');

module.exports = function authenticate(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // carries id, email, adminLevel (you put it in the token)
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
