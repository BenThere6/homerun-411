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
  role: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User',
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
    firstName: String,
    lastName: String,
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
    settings: {
      shareLocation: {
        type: Boolean,
        default: false,
      },
    },
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;