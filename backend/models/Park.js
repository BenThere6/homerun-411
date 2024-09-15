const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const parkSchema = new Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },  // City of the park
  state: { type: String, required: true }, // State of the park
  coordinates: {
    type: { type: String, default: 'Point' }, // Required for 2dsphere index
    coordinates: { type: [Number], required: true }, // Array of [longitude, latitude]
  },
  interactiveMapPositionDetails: { type: String }, // Google Maps or similar
  satelliteImageUrl: { type: String }, // Satellite or aerial view image URL
  pictures: {
    dugoutUrl: { type: String },
    sidelinesUrl: { type: String },
    shadedAreasUrl: { type: String },
  },
  mainImageUrl: { type: String }, // Field for the main park image
  closestParkingToField: { type: String },
  bleachers: { type: Boolean },
  handicapAccess: {
    hasAccess: { type: Boolean },
    details: { type: String }, // Access details like stairs, paved sidewalks
  },
  concessions: {
    available: { type: Boolean },
    details: { type: String },
    paymentMethods: { type: String }, // Payment methods: card, cash
  },
  coolersAllowed: { type: Boolean },
  canopiesAllowed: { type: Boolean },
  surfaceMaterial: { type: String },
  lights: { type: Boolean },
  restrooms: {
    type: String,
    enum: ['portable', 'permanent', 'none'],
  },
  fenceDistance: { type: Number }, // Fence distance for home runs
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

// Create a 2dsphere index on the coordinates field for geospatial queries
parkSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Park', parkSchema);