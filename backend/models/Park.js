const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const parkSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String }, // New field for address
  city: { type: String, required: true },
  state: { type: String, required: true },
  coordinates: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // Required for geolocation
  },
  fields: [
    {
      name: { type: String, required: true }, // Name of the field
      location: { type: String }, // Field location within the park
      fenceDistance: { type: Number }, // Distance for home run tracking
      grassOutfield: { type: Boolean }, // Is the outfield grass?
      turf: { type: Boolean }, // Is the field turf?
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
  interactiveMapPositionDetails: { type: String },
  satelliteImageUrl: { type: String },
  pictures: {
    dugoutUrl: { type: String },
    sidelinesUrl: { type: String },
    shadedAreasUrl: { type: String },
    mainImageUrl: { type: String },
  },
  closestParkingToField: { type: String },
  parking: {
    locations: [{ type: String }], // Array of parking locations
    distanceToField: { type: String }, // Distance from parking to field
    handicapSpots: { type: Number }, // Number of handicap spots
  },
  bleachers: {
    available: { type: Boolean },
    description: { type: String }, // Description of bleachers
  },
  dugouts: {
    covered: { type: Boolean }, // Is the dugout covered?
    brickedIn: { type: Boolean }, // Is the dugout bricked in?
    fenced: { type: Boolean }, // Is the dugout fenced?
  },
  fence: {
    available: { type: Boolean }, // Is there a fence around the field?
    material: { type: String, enum: ['wood', 'cement', 'brick'] }, // Material of the fence
  },
  fieldShade: { type: Boolean }, // Shade over the field
  parkShade: { type: Boolean }, // Shade over the park

  restrooms: [
    {
      location: { type: String }, // Location of restrooms
      runningWater: { type: Boolean }, // Is there running water?
      changingTable: { type: Boolean }, // Is there a changing table?
      numStalls: { type: Number }, // Number of stalls
    },
  ],
  concessions: {
    available: { type: Boolean, required: true }, // Now required
    details: { type: String },
    paymentMethods: {
      type: [String], // List of payment methods, e.g., cash, card, Venmo
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
  surfaceMaterial: { type: String, required: true }, // Now required
  lights: { type: Boolean, required: true }, // Now required
  fenceDistance: { type: Number },
  powerWaterAccess: {
    available: { type: Boolean },
    locations: [{ type: String }], // Array of locations for outlets, etc.
  },
  sidewalks: { type: Boolean },
  gravelPaths: { type: Boolean },
  stairs: { type: Boolean },
  hills: { type: Boolean },

  gateEntranceFee: { type: Boolean },

  playground: {
    available: { type: Boolean, required: true }, // Now required
    location: { type: String }, // Location of playground
    nearParking: { type: Boolean }, // Is the playground near parking?
  },

  spectatorConditions: {
    locationTypes: {
      type: [String], // Can be grass, cement, gravel, etc.
      enum: ['grass', 'cement', 'gravel', 'dirt'],
    },
  },

  backstop: {
    material: { type: String, enum: ['fence', 'net'] }, // Fence or net backstop
    distance: { type: Number }, // Distance from backstop to field
  },

  nearbyAmenities: {
    gasStations: { type: Boolean, default: false }, // These can be flags for whether they exist
    fastFood: { type: Boolean, default: false },
    sitDownRestaurants: { type: Boolean, default: false },
    groceryStores: { type: Boolean, default: false },
    hotels: { type: Boolean, default: false },
    otherActivities: { type: Boolean, default: false },
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