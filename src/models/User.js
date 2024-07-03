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
});

const User = mongoose.model('User', userSchema);

module.exports = User;