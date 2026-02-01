// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // recipient (post owner)
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // who liked/commented
        type: { type: String, enum: ['like', 'comment', 'comment_like'], required: true },
        post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
        comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Fast queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
// De‑dupe “like” spam (one like-notification per actor+post)
notificationSchema.index(
    { user: 1, actor: 1, post: 1, type: 1 },
    { unique: true, partialFilterExpression: { type: 'like' } }
);

module.exports = mongoose.model('Notification', notificationSchema);