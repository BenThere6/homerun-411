const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  referencedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  editedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Optional: small performance boost when querying likes
commentSchema.index({ referencedPost: 1 });
commentSchema.index({ author: 1 });

// Keep updatedAt correct on edits
commentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;