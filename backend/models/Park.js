const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const parkSchema = new Schema({
  name: { type: String, required: true },
  city: { type: String, required: true }, 
  state: { type: String, required: true }, 
  coordinates: {
    type: { type: String, default: 'Point' }, 
    coordinates: { type: [Number], required: true }, // Required for geolocation
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
    hasAccess: { type: Boolean, required: true }, // Now required
    details: { type: String },
  },
  concessions: {
    available: { type: Boolean, required: true }, // Now required
    details: { type: String },
    paymentMethods: { type: String },
  },
  coolersAllowed: { type: Boolean },
  canopiesAllowed: { type: Boolean },
  surfaceMaterial: { type: String, required: true }, // Now required
  lights: { type: Boolean, required: true }, // Now required
  restrooms: {
    type: String,
    enum: ['portable', 'permanent', 'none'],
    required: true, // Now required
  },
  fenceDistance: { type: Number },
  powerWaterAccess: { type: Boolean },
  cellReception: { type: Boolean },
  shadedAreas: {
    available: { type: Boolean },
  },
  playground: {
    available: { type: Boolean, required: true }, // Now required
    closeToParking: { type: Boolean },
  },
  moundType: {
    type: String,
    enum: ['dirt', 'turf', 'movable'],
  },
  fieldTypes: {
    type: String,
    enum: ['baseball', 'softball', 'both'],
    required: true, // Already required
  },
});

// Create a 2dsphere index on the coordinates field for geospatial queries
parkSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Park', parkSchema);