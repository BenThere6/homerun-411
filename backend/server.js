const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const connectDB = require('./mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const isAdmin = require('./middleware/isAdmin');
const isTopAdmin = require('./middleware/isTopAdmin');

const app = express();
const PORT = process.env.PORT || 4000;

const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
      {
        id: user._id,
        email: user.email,
        adminLevel: user.adminLevel, // Include adminLevel in token
      },
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
    req.user = decoded; // Include adminLevel from token
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
    const { email, password, zipCode, firstName, lastName, adminLevel } = req.body; // Include adminLevel

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
      adminLevel: adminLevel !== undefined ? adminLevel : 2, // Default to regular user (Level 2)
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
app.get('/check-admin', async (req, res) => {
  try {
    const adminExists = await User.exists({ adminLevel: { $lte: 1 } }); // Check for Top Admin or Admin
    res.json({ adminExists });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Promote a user to admin (Top Admin only)
app.patch('/api/admin/promote/:userId', authenticate, isTopAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.adminLevel === 2) {
      user.adminLevel = 1; // Promote Regular User (2) to Admin (1)
      await user.save();
      return res.json({ message: 'User promoted to Admin (Level 1)', user });
    }

    res.status(400).json({ message: 'User is already an Admin or Top Admin.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Demote a user to regular user (Top Admin only)
app.patch('/api/admin/demote/:userId', authenticate, isTopAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.adminLevel === 1) {
      user.adminLevel = 2; // Demote Admin (1) to Regular User (2)
      await user.save();
      return res.json({ message: 'User demoted to Regular User (Level 2)', user });
    }

    res.status(400).json({ message: 'User is already a Regular User or Top Admin.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      email: user.email,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      createdAt: user.createdAt, // Ensure this field exists in the schema
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
app.patch('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, avatarUrl, bio } = req.body; // Define fields you want to allow for update

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (avatarUrl) user.profile.avatarUrl = avatarUrl;
    if (bio) user.profile.bio = bio;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      profile: user.profile,
    });
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