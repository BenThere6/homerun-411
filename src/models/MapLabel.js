const mongoose = require('mongoose');

const mapLabelSchema = new mongoose.Schema({
    park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park', required: true },
    labelName: { type: String, required: true },
    coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    }
});

module.exports = mongoose.model('MapLabel', mapLabelSchema);