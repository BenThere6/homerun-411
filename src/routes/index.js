const express = require('express');
const router = express.Router();

// Import all route files
const adminRoutes = require('./api/admin');
const amazonAffiliateItemRoutes = require('./api/amazonAffiliateItem');
const commentRoutes = require('./api/comment');
const dugoutSwapRoutes = require('./api/dugoutSwapItem');
const mapLabelRoutes = require('./api/maplabel');
const messageRoutes = require('./api/message');
const nearestAmenitiesRoutes = require('./api/nearestAmenities');
const parkRoutes = require('./api/park');
const postRoutes = require('./api/post');
const subscriptionRoutes = require('./api/subscription');
const userRoutes = require('./api/user');
const weatherRoutes = require('./api/weather');

// Use the imported routes
router.use('/admin', adminRoutes);
router.use('/amazonaffiliateitem', amazonAffiliateItemRoutes);
router.use('/comment', commentRoutes);
router.use('/dugoutswap', dugoutSwapRoutes);
router.use('/maplabel', mapLabelRoutes);
router.use('/message', messageRoutes);
router.use('/nearestamenities', nearestAmenitiesRoutes);
router.use('/park', parkRoutes);
router.use('/post', postRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/user', userRoutes);
router.use('/weather', weatherRoutes);

module.exports = router;