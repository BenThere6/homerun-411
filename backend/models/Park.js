const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const parkSchema = new Schema({
  name: { type: String, required: true },
  coordinates: {
    type: { type: String, default: 'Point' }, // This is required for the 2dsphere index
    coordinates: { type: [Number], required: true }, // Array of numbers: [longitude, latitude]
  },
  interactiveMapPositionDetails: { type: String }, // e.g., Google Maps embed URL or details
  satelliteImageUrl: { type: String }, // May not need if using interactive map
  pictures: {
    dugoutUrl: { type: String },
    sidelinesUrl: { type: String },
    shadedAreasUrl: { type: String },
  },
  closestParkingToField: { type: String },
  bleachers: { type: Boolean },
  handicapAccess: {
    hasAccess: { type: Boolean },
    details: { type: String }, // e.g., stairs, paved sidewalks, or gravel
  },
  concessions: {
    available: { type: Boolean },
    details: { type: String },
    paymentMethods: { type: String }, // e.g., card, cash
  },
  coolersAllowed: { type: Boolean },
  canopiesAllowed: { type: Boolean },
  surfaceMaterial: { type: String },
  lights: { type: Boolean },
  restrooms: {
    type: String,
    enum: ['portable', 'permanent', 'none'],
  },
  fenceDistance: { type: Number }, // For home runs
  powerWaterAccess: { type: Boolean },
  cellReception: { type: Boolean },
  shadedAreas: {
    available: { type: Boolean },
  },
  playground: {
    available: { type: Boolean },
    closeToParking: { type: Boolean },
  },
  moundType: {
    type: String,
    enum: ['dirt', 'turf', 'movable'],
  },
});

// Create a 2dsphere index on the coordinates field
parkSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Park', parkSchema);