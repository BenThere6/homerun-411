const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  park: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Park', // Reference to the Park schema
    required: true,
  },
  category: {
    type: String,
    enum: [
      'firstBaseSideline',
      'thirdBaseSideline',
      'dugout',
      'concessions',
      'parking',
      'skyView',
      'other'
    ], // Hardcoded list of categories
    required: true,
  },
  url: {
    type: String, // URL to the image stored in the cloud
    required: true,
  },
  description: {
    type: String, // Optional description of the image
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Image', imageSchema);