const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fieldSchema = new Schema({
  name: { type: String }, // Field Name
  location: { type: String }, // Field Location
  fenceDistance: { type: Number }, // Fence Distance (ft)
  fieldType: { type: String, enum: ['baseball', 'softball', 'both'] }, // Baseball, Softball, Both
  outfieldMaterial: { type: String, enum: ['grass', 'turf'] }, // Grass, Turf
  infieldMaterial: { type: String, enum: ['grass', 'dirt'] }, // Grass, Dirt
  moundType: { type: String, enum: ['dirt', 'turf', 'portable'] }, // Dirt, Turf, Portable
  fieldShadeDescription: { type: String }, // Field Shade Description
  parkingDistanceToField: { type: String }, // Parking Distance to Field
  bleachersAvailable: { type: Boolean }, // Bleachers Available?
  bleachersDescription: { type: String }, // Bleachers Description
  backstopMaterial: { type: String, enum: ['fence', 'net'] }, // Fence, Net
  backstopDistance: { type: Number }, // Backstop Distance (ft)
  dugoutsCovered: { type: Boolean }, // Dugouts Covered?
  dugoutsMaterial: { type: String, enum: ['brick', 'fence'] }, // Dugouts Material
});

const restroomSchema = new Schema({
  location: { type: String }, // Restroom Location
  runningWater: { type: Boolean }, // Running Water?
  changingTable: { type: String, enum: ["men's", "women's", 'both', 'neither'] }, // Changing Table
  numStalls: { type: Number }, // Number of Stalls
});

const concessionsSchema = new Schema({
  available: { type: Boolean }, // Concessions Available?
  snacks: { type: Boolean }, // Snacks Available?
  drinks: { type: Boolean }, // Drinks Available?
  otherFood: { type: String }, // Other Food Description
  paymentMethods: {
    type: [String],
    enum: ['cash', 'card', 'venmo', 'apple pay'], // Payment Methods
  },
});

const playgroundSchema = new Schema({
  available: { type: Boolean }, // Playground Available?
  location: { type: String }, // Playground Location
  condition: { type: String }, // Playground Condition
});

const parkSchema = new Schema({
  name: { type: String, required: true }, // Park Name
  address: { type: String, required: true }, // Park Address
  city: { type: String, required: true }, // Park City
  state: { type: String, required: true }, // Park State
  numberOfFields: { type: Number }, // Number of Fields
  fields: [fieldSchema], // Fields Array

  googleMaps: {
    embedUrl: { type: String }, // Google Maps Embed URL
    apiData: { type: Map, of: String }, // Google Maps API Data
  },

  closestParkingToField: { type: String }, // Closest Parking to Field
  parking: {
    locations: [{ type: String }], // Parking Locations
    handicapSpots: { type: Number }, // Handicap Spots
  },
  parkShade: { type: String }, // Park Shade Description

  restrooms: [restroomSchema], // Restroom Array

  concessions: concessionsSchema, // Concessions Schema

  coolersAllowed: { type: Boolean }, // Coolers Allowed?
  canopiesAllowed: { type: Boolean }, // Canopies Allowed?
  surfaceMaterial: { type: String }, // Surface Material
  lights: { type: Boolean }, // Lights Available?
  fenceDistance: { type: Number }, // Fence Distance (ft)
  powerAccess: {
    available: { type: Boolean }, // Power Access Available?
    locations: [{ type: String }], // Power Locations
  },
  sidewalks: { type: Boolean }, // Sidewalks Available?
  gravelPaths: { type: Boolean }, // Gravel Paths Available?
  stairs: { type: Boolean }, // Stairs Available?
  hills: { type: Boolean }, // Hills Available?
  gateEntranceFee: { type: Boolean }, // Gate Entrance Fee?
  playground: playgroundSchema, // Playground Schema
  spectatorConditions: {
    locationTypes: {
      type: [String],
      enum: ['grass', 'cement', 'gravel', 'dirt'], // Spectator Location Types
    },
  },
  coordinates: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number] },
  },
  fieldTypes: { type: String, enum: ['baseball', 'softball', 'both'] }, // Field Types
});

parkSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Park', parkSchema);