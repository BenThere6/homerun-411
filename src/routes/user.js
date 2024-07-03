const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware function to fetch a user by ID
async function getUser(req, res, next) {
  let user;
  try {
    user = await User.findById(req.params.id);
    if (user == null) {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.user = user;
  next();
}

// Create a new user
router.post('/users', async (req, res) => {
  try {
    const { email, passwordHash, role, location, zipCode } = req.body;

    const newUser = new User({
      email,
      passwordHash,
      role,
      location,
      zipCode,
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific user by ID
router.get('/users/:id', getUser, (req, res) => {
  res.json(res.user);
});

// Update a specific user by ID
router.patch('/users/:id', getUser, async (req, res) => {
  if (req.body.email != null) {
    res.user.email = req.body.email;
  }
  if (req.body.passwordHash != null) {
    res.user.passwordHash = req.body.passwordHash;
  }
  if (req.body.role != null) {
    res.user.role = req.body.role;
  }
  if (req.body.location != null) {
    res.user.location = req.body.location;
  }
  if (req.body.zipCode != null) {
    res.user.zipCode = req.body.zipCode;
  }

  try {
    const updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific user by ID
router.delete('/users/:id', getUser, async (req, res) => {
  try {
    await res.user.remove();
    res.json({ message: 'Deleted user' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /users/profile
router.get('/users/profile', async (req, res) => {
  try {
    // Assuming authentication middleware sets req.user with the logged-in user's data
    const user = await User.findById(req.user.id).populate('favoriteParks recentlyVisitedParks');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;