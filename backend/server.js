const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const connectDB = require('./mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const isAdmin = require('./middleware/isAdmin');
const isTopAdmin = require('./middleware/isTopAdmin');
const zipcodes = require('zipcodes');
const authenticate = require('./middleware/authenticate');

const app = express();
const PORT = process.env.PORT || 4000;

const cloudinary = require("cloudinary").v2;

const buildAllow = () => new Set(
  String(process.env.TOP_ADMIN_EMAILS || process.env.SUPER_ADMIN_EMAILS || '')
    .split(/[,\s]+/)
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
);

if (process.env.NODE_ENV !== 'production') {
  console.log('TOP_ADMIN_EMAILS ->', process.env.TOP_ADMIN_EMAILS);
}

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('ok');
});

// Connect to MongoDB
connectDB();

// Add this at the top of your server.js
app.use((req, res, next) => {
  console.log(`🔥 Request received: ${req.method} ${req.originalUrl}`);
  next();
});

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

    // --- SUPER-ADMIN ALLOWLIST: auto-persist adminLevel 0 for allowlisted emails ---
    const __SUPER_SET = new Set(
      String(process.env.TOP_ADMIN_EMAILS || process.env.SUPER_ADMIN_EMAILS || '')
        .split(/[,\s]+/)
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)
    );
    if (__SUPER_SET.has(user.email.toLowerCase()) && user.adminLevel !== 0) {
      user.adminLevel = 0;
      await user.save();
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
    const { email, password, zipCode, firstName, lastName, adminLevel } = req.body;

    if (!email || !password || !zipCode || !firstName || !lastName) {
      return res.status(400).json({ message: 'First name, last name, email, password, and zip code are required.' });
    }

    const loc = zipcodes.lookup(zipCode);

    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
      return res.status(400).json({ message: 'Invalid zip code. Please enter a valid zip code.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const __SUPER_SET = new Set(
      String(process.env.TOP_ADMIN_EMAILS || process.env.SUPER_ADMIN_EMAILS || '')
        .split(/[,\s]+/)
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)
    );
    const adminLevelToSet =
      __SUPER_SET.has(email.toLowerCase()) ? 0 :
        (adminLevel !== undefined ? adminLevel : 2);

    const newUser = new User({
      email,
      passwordHash: hashedPassword,
      zipCode,
      profile: { firstName, lastName },
      adminLevel: adminLevelToSet,
      location: {
        type: 'Point',
        coordinates: [loc.longitude, loc.latitude],
      },
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

// Get user profile (self-healing for adminLevel + allowlist auto-promotion)
app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const allow = buildAllow();
    const emailLc = (user.email || '').toLowerCase();
    let changed = false;

    // If they’re on the allowlist but not marked top-admin, promote now.
    if (emailLc && allow.has(emailLc) && Number(user.adminLevel) !== 0) {
      user.adminLevel = 0;
      changed = true;
    }

    // If adminLevel is missing entirely, give it the default 2 (regular user).
    if (user.adminLevel === undefined || user.adminLevel === null) {
      user.adminLevel = 2;
      changed = true;
    }

    if (changed) await user.save();

    res.json({
      email: user.email,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      adminLevel: user.adminLevel,
      isTopAdmin: Number(user.adminLevel) === 0,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('profile error', err);
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