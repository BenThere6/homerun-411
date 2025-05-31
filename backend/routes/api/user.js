const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');
const zipcodes = require('zipcodes');
const Park = require('../../models/Park');

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
  console.log('INSIDE /api/user POST / route');
  try {
    const { email, passwordHash, role, zipCode } = req.body;

    const loc = zipcodes.lookup(zipCode);

    console.log('LOOKUP RESULT:', loc);
    console.log('LATITUDE:', loc?.latitude);
    console.log('LONGITUDE:', loc?.longitude);

    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
      return res.status(400).json({ message: 'Invalid zip code. Please enter a valid zip code.' });
    }

    const newUser = new User({
      email,
      passwordHash,
      role,
      zipCode,
      location: {
        type: 'Point',
        coordinates: [loc.longitude, loc.latitude],
      },
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

// Return Favorite, Recently Viewed, and Nearby Parks

function calculateDistanceInMiles(userCoords, parkCoords) {
  if (!parkCoords || parkCoords.length !== 2) return null;

  const [lon1, lat1] = userCoords;
  const [lon2, lat2] = parkCoords;

  const toRad = angle => (angle * Math.PI) / 180;
  const R = 3958.8; // Radius of Earth in miles

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10; // Rounded to 1 decimal
}

router.get('/home-parks', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favoriteParks')
      .populate('recentlyViewedParks.park');

    const overrideLat = parseFloat(req.query.lat);
    const overrideLon = parseFloat(req.query.lon);
    const userCoords = (overrideLat && overrideLon)
      ? [overrideLon, overrideLat]  // [lon, lat]
      : user.location?.coordinates;

    console.log('📨 Received override coords:', overrideLat, overrideLon);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const favoriteParks = user.favoriteParks.map(park => {
      const distance = calculateDistanceInMiles(
        userCoords,
        park.coordinates?.coordinates
      );
      return {
        ...park.toObject(),
        distanceInMiles: distance,
      };
    });

    const recentlyViewedParks = user.recentlyViewedParks
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 3)
      .map(entry => {
        const park = entry.park;
        const distance = calculateDistanceInMiles(
          userCoords,
          park.coordinates?.coordinates
        );
        return {
          ...park.toObject(),
          distanceInMiles: distance,
        };
      });

    // Nearby Parks (if user has location)
    const miles = 30;
    const maxDistance = miles * 1609.34;

    let nearbyParks = [];
    if (userCoords && userCoords.length === 2) {
      nearbyParks = await Park.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: userCoords,
            },
            distanceField: 'distanceInMeters',
            spherical: true,
            maxDistance,
          },
        },
        {
          $addFields: {
            distanceInMiles: {
              $round: [{ $divide: ['$distanceInMeters', 1609.34] }, 1],
            },
          },
        },
        { $limit: 3 },
      ]);
    }

    res.json({
      favorites: favoriteParks,
      nearby: nearbyParks,
      recent: recentlyViewedParks,
    });
  } catch (err) {
    console.error('🔥 Error in /api/user/home-parks:', err);
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

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Send full user object (or pick specific fields)
    res.json({
      profile: user.profile,
      location: user.location,
      email: user.email,
      role: user.role,
      zipCode: user.zipCode,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific user by ID
router.get('/:id', auth, getUser, (req, res) => {
  res.json(res.user);
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

// Record recently viewed park
router.post('/recently-viewed/:parkId', auth, async (req, res) => {
  try {
    const { parkId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove park if it already exists to move it to the front
    user.recentlyViewedParks = user.recentlyViewedParks.filter(
      entry => entry.park.toString() !== parkId
    );

    // Add to beginning of array
    user.recentlyViewedParks.unshift({ park: parkId, viewedAt: new Date() });

    // Optionally limit to last 5 parks
    if (user.recentlyViewedParks.length > 5) {
      user.recentlyViewedParks = user.recentlyViewedParks.slice(0, 5);
    }

    await user.save();

    res.status(200).json({ message: 'Park recorded as recently viewed.' });
  } catch (error) {
    console.error('Failed to record recently viewed park:', error);
    res.status(500).json({ message: 'Server error' });
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