const mongoose = require('mongoose');

const parkSchema = new mongoose.Schema({
    name: { type: String, required: true },
    county: { type: String },
    surface: { type: String },
    lights: { type: Boolean, default: false },
    concessions: { type: Boolean, default: false },
    restrooms: { type: String, enum: ['Portable', 'Permanent', 'Unknown'], default: 'Unknown' },
    playground: { type: Boolean, default: false },
    coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    imageUrl: { type: String }
});

module.exports = mongoose.model('Park', parkSchema);