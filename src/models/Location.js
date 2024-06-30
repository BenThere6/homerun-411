const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park', required: true },
    locationType: { type: String, enum: ['Restaurant', 'Gas Station', 'Grocery Store', 'Hotel'], required: true },
    name: { type: String, required: true },
    address: { type: String },
    coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    distanceFromPark: { type: Number }
});

module.exports = mongoose.model('Location', locationSchema);