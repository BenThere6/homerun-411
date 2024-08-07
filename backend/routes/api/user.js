const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');

// Middleware function to fetch a user by ID
async function getUser(req, res, next) {
  let user;
  try {
    user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.user = user;
  next();
}

// Create a new user
router.post('/', async (req, res) => {
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

// Add a favorite park
router.post('/favorite-parks/:parkId', auth, async (req, res) => {
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

// Get all users (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search users by email (admin only)
router.get('/search', auth, isAdmin, async (req, res) => {
  try {
    const userEmail = req.query.email;
    const users = await User.find({ email: { $regex: userEmail, $options: 'i' } });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific user by ID
router.get('/:id', auth, getUser, (req, res) => {
  res.json(res.user);
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a specific user by ID
router.patch('/:id', auth, getUser, async (req, res) => {
  const updateFields = ['email', 'passwordHash', 'role', 'location', 'zipCode'];

  updateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      res.user[field] = req.body[field];
    }
  });

  try {
    const updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.firstName !== undefined) {
      user.profile.firstName = req.body.firstName;
    }
    if (req.body.lastName !== undefined) {
      user.profile.lastName = req.body.lastName;
    }
    if (req.body.avatarUrl !== undefined) {
      user.profile.avatarUrl = req.body.avatarUrl;
    }
    if (req.body.bio !== undefined) {
      user.profile.bio = req.body.bio;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update user settings
router.patch('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.notifications !== undefined) {
      user.settings.notifications = req.body.notifications;
    }
    if (req.body.theme !== undefined) {
      user.settings.theme = req.body.theme;
    }
    if (req.body.shareLocation !== undefined) {
      user.settings.shareLocation = req.body.shareLocation;
    }
    if (req.body.contentFilter !== undefined) {
      user.settings.contentFilter = req.body.contentFilter;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific user by ID
router.delete('/:userId', auth, isAdmin, async (req, res) => {
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

// Remove a favorite park
router.delete('/favorite-parks/:parkId', auth, async (req, res) => {
  try {
    const parkId = req.params.parkId;

    // Find the user by their authenticated ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out the parkId from user's favoriteParks array
    user.favoriteParks = user.favoriteParks.filter(p => p.toString() !== parkId);
    await user.save();

    // Respond with updated list of favoriteParks
    res.json(user.favoriteParks);
  } catch (err) {
    // Handle any errors that occur during the process
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;