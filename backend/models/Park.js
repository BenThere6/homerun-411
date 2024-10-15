const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fieldSchema = new Schema({
  name: { type: String }, // Field Name
  location: { type: String }, // Field Location
  fenceDistance: { type: Number }, // Field Fence Distance
  fieldType: { type: String, enum: ['baseball', 'softball', 'both'] }, // Baseball, Softball, Both
  outfieldMaterial: { type: String, enum: ['grass', 'turf'] }, // Grass, Turf
  infieldMaterial: { type: String, enum: ['grass', 'dirt'] }, // Grass, Dirt
  moundType: { type: String, enum: ['dirt', 'turf', 'movable'] }, // Dirt, Turf, Movable
  fieldShadeDescription: { type: String }, // Field Shade Description
  parkingDistanceToField: { type: String }, // Parking Distance to Field
  bleachersAvailable: { type: Boolean }, // Field Bleachers?
  bleachersDescription: { type: String }, // Field Bleachers Description
  backstopMaterial: { type: String, enum: ['fence', 'net'] }, // Fence, Net
  backstopDistance: { type: Number }, // Backstop Distance (ft)
  dugoutsCovered: { type: Boolean }, // Dugouts Covered?
  dugoutsMaterial: { type: String, enum: ['brick', 'fence'] }, // Dugouts Material
});

const parkSchema = new Schema({
  // Required fields from the sheet
  name: { type: String, required: true }, // Park Name
  address: { type: String, required: true }, // Park Address
  city: { type: String, required: true }, // Park City
  state: { type: String, required: true }, // Park State

  // Non-required fields for the park from the sheet
  numberOfFields: { type: Number }, // Number of Fields
  
  // Fields schema array (1-n fields, based on the sheet structure)
  fields: [fieldSchema], // Schema for Field details

  // Google Maps-related data (not in the sheet but kept in schema)
  googleMaps: {
    embedUrl: { type: String }, // URL for Google Maps embed
    apiData: { type: Map, of: String }, // Additional Google Maps API-related data
  },

  // Closest parking to a field
  closestParkingToField: { type: String },

  // Park-wide amenities and features
  parking: {
    locations: [{ type: String }],
    handicapSpots: { type: Number },
  },
  parkShade: { type: String }, // Park Shade Description

  // Restrooms
  restrooms: [
    {
      location: { type: String },
      runningWater: { type: Boolean },
      changingTable: { type: Boolean },
      numStalls: { type: Number },
    },
  ],

  // Concessions
  concessions: {
    available: { type: Boolean },
    snacks: { type: Boolean },
    drinks: { type: Boolean },
    otherFood: { type: String }, // Other food description
    paymentMethods: {
      type: [String],
      enum: ['cash', 'card', 'Venmo', 'Apple Pay'],
    },
  },

  // Other park-level features
  coolersAllowed: { type: Boolean },
  canopiesAllowed: { type: Boolean },
  surfaceMaterial: { type: String },
  lights: { type: Boolean },
  fenceDistance: { type: Number }, // Overall park fence distance
  powerAccess: {
    available: { type: Boolean },
    locations: [{ type: String }],
  },
  waterAccess: {
    available: { type: Boolean },
    locations: [{ type: String }],
  },
  sidewalks: { type: Boolean },
  gravelPaths: { type: Boolean },
  stairs: { type: Boolean },
  hills: { type: Boolean },
  gateEntranceFee: { type: Boolean },
  playground: {
    available: { type: Boolean },
    location: { type: String },
  },
  spectatorConditions: {
    locationTypes: {
      type: [String],
      enum: ['grass', 'cement', 'gravel', 'dirt'],
    },
  },

  // Nearby amenities
  nearbyAmenities: {
    gasStations: { type: Boolean, default: false },
    fastFood: { type: Boolean, default: false },
    sitDownRestaurants: { type: Boolean, default: false },
    groceryStores: { type: Boolean, default: false },
    hotels: { type: Boolean, default: false },
    otherActivities: { type: Boolean, default: false },
  },

  // Coordinates for geospatial queries (not in the sheet but kept in schema)
  coordinates: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number] },
  },

  // Field types (Baseball, Softball, Both)
  fieldTypes: { type: String, enum: ['baseball', 'softball', 'both'], required: false },
});

// Create a 2dsphere index on the coordinates field for geospatial queries
parkSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Park', parkSchema);