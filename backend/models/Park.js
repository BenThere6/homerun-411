const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const parkSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true }, // Added address
  city: { type: String, required: true }, // Added city
  state: { type: String, required: true }, // Added state
  coordinates: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  fields: [
    {
      name: { type: String, required: true },
      location: { type: String },
      fenceDistance: { type: Number },
      grassOutfield: { type: Boolean },
      turf: { type: Boolean },
      moundType: {
        type: String,
        enum: ['dirt', 'turf', 'movable'],
      },
      infieldMaterial: {
        type: String,
        enum: ['grass', 'dirt'],
      },
    },
  ],
  googleMaps: {
    embedUrl: { type: String }, // URL for the Google Maps embed
    apiData: { type: Map, of: String }, // Other Google Maps API-related data
  },
  closestParkingToField: { type: String },
  parking: {
    locations: [{ type: String }],
    distanceToField: { type: String },
    handicapSpots: { type: Number },
  },
  bleachers: {
    available: { type: Boolean },
    description: { type: String },
  },
  dugouts: {
    covered: { type: Boolean },
    brickedIn: { type: Boolean },
    fenced: { type: Boolean },
  },
  fence: {
    available: { type: Boolean },
    material: { type: String, enum: ['wood', 'cement', 'brick'] },
  },
  fieldShade: { type: Boolean },
  parkShade: { type: Boolean },
  restrooms: [
    {
      location: { type: String },
      runningWater: { type: Boolean },
      changingTable: { type: Boolean },
      numStalls: { type: Number },
    },
  ],
  concessions: {
    available: { type: Boolean, required: true },
    details: { type: String },
    paymentMethods: {
      type: [String],
      enum: ['cash', 'card', 'Venmo', 'Apple Pay'],
    },
    foodOptions: {
      drinks: { type: Boolean },
      snacks: { type: Boolean },
      otherFood: { type: Boolean },
    },
  },
  coolersAllowed: { type: Boolean },
  canopiesAllowed: { type: Boolean },
  surfaceMaterial: { type: String, required: true },
  lights: { type: Boolean, required: true },
  fenceDistance: { type: Number },
  powerWaterAccess: {
    available: { type: Boolean },
    locations: [{ type: String }],
  },
  sidewalks: { type: Boolean },
  gravelPaths: { type: Boolean },
  stairs: { type: Boolean },
  hills: { type: Boolean },
  gateEntranceFee: { type: Boolean },
  playground: {
    available: { type: Boolean, required: true },
    location: { type: String },
    nearParking: { type: Boolean },
  },
  spectatorConditions: {
    locationTypes: {
      type: [String],
      enum: ['grass', 'cement', 'gravel', 'dirt'],
    },
  },
  backstop: {
    material: { type: String, enum: ['fence', 'net'] },
    distance: { type: Number },
  },
  nearbyAmenities: {
    gasStations: { type: Boolean, default: false },
    fastFood: { type: Boolean, default: false },
    sitDownRestaurants: { type: Boolean, default: false },
    groceryStores: { type: Boolean, default: false },
    hotels: { type: Boolean, default: false },
    otherActivities: { type: Boolean, default: false },
  },
  fieldTypes: {
    type: String,
    enum: ['baseball', 'softball', 'both'],
    required: true,
  },
});

// Create a 2dsphere index on the coordinates field for geospatial queries
parkSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Park', parkSchema);