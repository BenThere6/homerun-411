const mongoose = require('mongoose');

const ParkDataRequestSchema = new mongoose.Schema({
  parkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Park', index: true },
  parkName: String,
  city: String,
  state: String,

  message: { type: String, required: true, trim: true },
  contactEmail: { type: String, trim: true },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: { type: String, enum: ['open', 'in_progress', 'closed'], default: 'open', index: true },
  notes: String,
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  source: { type: String, default: 'ParkDetails' },
}, { timestamps: true });

ParkDataRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ParkDataRequest', ParkDataRequestSchema);
