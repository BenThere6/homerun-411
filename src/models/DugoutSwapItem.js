const mongoose = require('mongoose');

const dugoutSwapItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  condition: {
    type: String,
    enum: ['New', 'Used'],
    default: 'Used',
  },
  imageURL: {
    type: String,
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  zipCode: {
    type: String,
    required: true,
  },
});

const DugoutSwapItem = mongoose.model('DugoutSwapItem', dugoutSwapItemSchema);

module.exports = DugoutSwapItem;