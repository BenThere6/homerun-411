const mongoose = require('mongoose');

const weatherInfoSchema = new mongoose.Schema({
    park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park', required: true },
    temperature: { type: Number },
    conditions: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WeatherInfo', weatherInfoSchema);