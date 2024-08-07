const mongoose = require('mongoose');

const mapLabelSchema = new mongoose.Schema({
  referencedPark: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Park',
    required: true,
  },
  labelName: {
    type: String,
    required: true,
  },
  coordinates: {
    type: {
      type: String,
      required: true, // Specify the type of geometry (e.g., 'Point')
    },
    coordinates: {
      type: [Number],
      required: true, // Specify the coordinates (longitude and latitude)
    },
  },
});

mapLabelSchema.index({ coordinates: '2dsphere' });

const MapLabel = mongoose.model('MapLabel', mapLabelSchema);

module.exports = MapLabel;