const express = require('express');
const router = express.Router();

// Import all route files
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
// const weatherRoutes = require('./api/weather');
const checkinRoutes = require('./api/checkin');
const userActivityRoutes = require('./api/userActivity');
const appFeedbackRoutes = require('./api/appFeedback');

// Use the imported routes
router.use('/api/amazon-affiliate-item', amazonAffiliateItemRoutes);
router.use('/api/comment', commentRoutes);
router.use('/api/dugout-swap', dugoutSwapRoutes);
router.use('/api/map-label', mapLabelRoutes);
router.use('/api/message', messageRoutes);
router.use('/api/nearest-amenities', nearestAmenitiesRoutes);
router.use('/api/park', parkRoutes);
router.use('/api/post', postRoutes);
router.use('/api/subscription', subscriptionRoutes);
router.use('/api/user', userRoutes);
// router.use('/api/weather', weatherRoutes);
router.use('/api/checkin', checkinRoutes);
router.use('/api/user-activity', userActivityRoutes);
router.use('/api/app-feedback', appFeedbackRoutes);

module.exports = router;