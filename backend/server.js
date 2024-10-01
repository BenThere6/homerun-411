const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const connectDB = require('./mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const isAdmin = require('./middleware/isAdmin');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
const routes = require('./routes/index');
app.use('/', routes);

// Authentication route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '14d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      refreshToken,
      firstName: user.profile.firstName, // Send firstName to the frontend
      lastName: user.profile.lastName,   // Send lastName to the frontend
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to authenticate using the refresh token
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Logout Route
app.post('/api/auth/logout', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.refreshToken = null;
    await user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User registration route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, zipCode, firstName, lastName } = req.body;

    if (!email || !password || !zipCode || !firstName || !lastName) {
      return res.status(400).json({ message: 'First name, last name, email, password, and zip code are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      passwordHash: hashedPassword,
      zipCode,
      profile: { firstName, lastName },
    });

    const savedUser = await newUser.save();
    res.status(201).json({ message: 'Registration successful', user: savedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// View all users (Admin only)
app.get('/api/admin/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if an admin exists
router.get('/check-admin', async (req, res) => {
  try {
    const adminExists = await User.exists({ role: 'Admin' });
    res.json({ adminExists });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Promote a user to admin (Admin only)
app.patch('/api/admin/promote/:userId', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'Admin';
    await user.save();
    
    res.json({ message: 'User promoted to admin', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});