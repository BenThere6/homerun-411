const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const parkSchema = new Schema({
  name: { type: String, required: true },
  city: { type: String, required: true }, 
  state: { type: String, required: true }, 
  coordinates: {
    type: { type: String, default: 'Point' }, 
    coordinates: { type: [Number], required: true },
  },
  interactiveMapPositionDetails: { type: String },
  satelliteImageUrl: { type: String },
  pictures: {
    dugoutUrl: { type: String },
    sidelinesUrl: { type: String },
    shadedAreasUrl: { type: String },
    mainImageUrl: { type: String },
  },
  closestParkingToField: { type: String },
  bleachers: { type: Boolean },
  handicapAccess: {
    hasAccess: { type: Boolean },
    details: { type: String },
  },
  concessions: {
    available: { type: Boolean },
    details: { type: String },
    paymentMethods: { type: String },
  },
  coolersAllowed: { type: Boolean },
  canopiesAllowed: { type: Boolean },
  surfaceMaterial: { type: String },
  lights: { type: Boolean },
  restrooms: {
    type: String,
    enum: ['portable', 'permanent', 'none'],
  },
  fenceDistance: { type: Number },
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
  // New field for field types (baseball, softball, or both)
  fieldTypes: {
    type: String,
    enum: ['baseball', 'softball', 'both'], // Allows 'baseball', 'softball', or 'both'
    required: true, // Ensure it's specified when creating a new park
  },
});

// Create a 2dsphere index on the coordinates field for geospatial queries
parkSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Park', parkSchema);