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
  editedAt: { type: Date },
}, { timestamps: true }); // createdAt/updatedAt managed by Mongoose

// Optional: small performance boost when querying
commentSchema.index({ referencedPost: 1 });
commentSchema.index({ author: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;