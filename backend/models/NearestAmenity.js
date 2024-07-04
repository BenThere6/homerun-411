const mongoose = require('mongoose');

const nearestAmenitySchema = new mongoose.Schema({
  referencedPark: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Park',
    required: true,
  },
  locationType: {
    type: String,
    enum: ['Restaurant - Fast Food', 'Restaurant - Sit down', 'Gas station', 'Grocery store', 'Hotels'],
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  coordinates: {
    type: { type: String },
    coordinates: [Number],
    required: true,
  },
  distanceFromPark: {
    type: Number,
    required: true,
  },
});

nearestAmenitySchema.index({ coordinates: '2dsphere' });

const NearestAmenity = mongoose.model('NearestAmenity', nearestAmenitySchema);

module.exports = NearestAmenity;