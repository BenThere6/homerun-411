const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

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

// POST /users/favorite-parks/:parkId
router.post('/users/favorite-parks/:parkId', auth, async (req, res) => {
  try {
    const parkId = req.params.parkId;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.favoriteParks.includes(parkId)) {
      user.favoriteParks.push(parkId);
      await user.save();
    }

    res.json(user.favoriteParks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /users/search?email={email}
router.get('/users/search', isAdmin, async (req, res) => {
  try {
    const userEmail = req.query.email;
    const users = await User.find({ email: { $regex: userEmail, $options: 'i' } });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific user by ID
router.get('/users/:id', auth, getUser, (req, res) => {
  res.json(res.user);
});

// Update a specific user by ID
router.patch('/users/:id', auth, getUser, async (req, res) => {
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
router.delete('/users/:userId', authenticate, checkAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /users/favorite-parks/:parkId
router.delete('/users/favorite-parks/:parkId', auth, async (req, res) => {
  try {
    const parkId = req.params.parkId;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.favoriteParks = user.favoriteParks.filter(p => p.toString() !== parkId);
    await user.save();

    res.json(user.favoriteParks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;