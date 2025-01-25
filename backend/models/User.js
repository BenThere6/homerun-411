const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  refreshToken: { type: String },
  adminLevel: {
    type: Number,
    enum: [0, 1, 2], // 0 = Top Admin, 1 = Admin, 2 = Regular User
    default: 2, // Default to a regular user
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  zipCode: {
    type: String,
    required: true,
  },
  favoriteParks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Park',
  }],
  recentlyViewedParks: [{
    park: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Park',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  recentlyVisitedParks: [{
    park: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Park',
    },
    visitedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  unreadConversationsCount: {
    type: Number,
    default: 0,
  },
  profile: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    avatarUrl: String,
    bio: String,
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    shareLocation: {
      type: Boolean,
      default: false,
    },
    contentFilter: {
      type: String,
      enum: ['all', 'favorites', 'none'],
      default: 'all',
    },
  },
}, { timestamps: true }); // Enable timestamps automatically adds createdAt and updatedAt fields

const User = mongoose.model('User', userSchema);

module.exports = User;