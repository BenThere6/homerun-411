const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const parkSchema = new Schema({
  name: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
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

module.exports = mongoose.model('Park', parkSchema);