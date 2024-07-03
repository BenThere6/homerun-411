const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authenticate = require('../../middleware/auth.js');
const checkAdmin = require('../../middleware/isAdmin.js');
const User = require('../../models/User.js');

// Route to create a new admin user (for demo purposes)
router.post('/admin/create-admin', authenticate, checkAdmin, async (req, res) => {
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