const mongoose = require('mongoose');

const FeatureSuggestionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },

  parkContext: {
    parkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Park' },
    parkName: String,
    city: String,
    state: String,
  },

  contactEmail: { type: String, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: { type: String, enum: ['open', 'in_progress', 'closed'], default: 'open', index: true },
  notes: String,
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  source: { type: String, default: 'ParkDetails' },
}, { timestamps: true });

FeatureSuggestionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FeatureSuggestion', FeatureSuggestionSchema);
