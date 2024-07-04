const mongoose = require('mongoose');

const amazonAffiliateItemSchema = new mongoose.Schema({
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
    default: 'New',
  },
  imageURL: {
    type: String,
    required: true,
  },
  link: {
    type: String,
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
});

const AmazonAffiliateItem = mongoose.model('AmazonAffiliateItem', amazonAffiliateItemSchema);

module.exports = AmazonAffiliateItem;