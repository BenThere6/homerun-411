const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  pageUrl: String,
  referrerUrl: String,
  details: String,
  ipAddress: String,
  userAgent: String,
  sessionId: String,
  geolocation: {
    lat: Number,
    lon: Number,
  },
  responseTime: Number,
  outcome: String,
  deviceType: String,
  timestamp: { type: Date, default: Date.now },
});

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
module.exports = UserActivity;