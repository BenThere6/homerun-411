const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin'); // Assuming isAdmin middleware checks if user is admin
const User = require('../models/User');
const Park = require('../models/Park');

// Admin route to get all users
router.get('/admin/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin route to delete a user by ID
router.delete('/admin/users/:userId', auth, isAdmin, async (req, res) => {
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

// Admin route to update a park by ID
router.patch('/admin/parks/:parkId', auth, isAdmin, async (req, res) => {
  try {
    const parkId = req.params.parkId;
    const updateFields = req.body; // Fields to update

    const park = await Park.findByIdAndUpdate(parkId, updateFields, { new: true });

    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }

    res.json(park);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Example route to create a new admin user (for demo purposes)
router.post('/admin/create-admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin already exists
    let admin = await User.findOne({ email });
    if (admin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin user
    admin = new User({
      email,
      passwordHash: hashedPassword,
      role: 'Admin',
    });

    await admin.save();

    res.json({ message: 'Admin created successfully', admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;