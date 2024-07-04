const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  park: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Park',
    required: true,
  },
  temperature: {
    type: Number,
    required: true,
  },
  conditions: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Weather = mongoose.model('Weather', weatherSchema);

module.exports = Weather;