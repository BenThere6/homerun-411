const mongoose = require('mongoose');

const appFeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  ideasForImprovement: {
    type: String,
    default: '',
  },
});

const AppFeedback = mongoose.model('AppFeedback', appFeedbackSchema);

module.exports = AppFeedback;