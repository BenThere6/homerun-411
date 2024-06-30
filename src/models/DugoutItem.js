const mongoose = require('mongoose');

const dugoutItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    condition: { type: String, enum: ['New', 'Used'], default: 'Used' },
    imageUrl: { type: String }
});

module.exports = mongoose.model('DugoutItem', dugoutItemSchema);