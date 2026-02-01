const express = require('express');
const router = express.Router();
const Comment = require('../../models/Comment');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Notification = require('../../models/Notification');

// Middleware function to fetch a comment by ID
async function getComment(req, res, next) {
  let comment;
  try {
    comment = await Comment.findById(req.params.id);
    if (comment == null) {
      return res.status(404).json({ message: 'Comment not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.comment = comment;
  next();
}

// Create a new comment
router.post('/', auth, async (req, res) => {
  try {
    const { referencedPost, content, author } = req.body;
    const comment = new Comment({ referencedPost, content, author });
    const savedComment = await comment.save();
    res.status(201).json(savedComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all comments
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific comment by ID
router.get('/:id', getComment, (req, res) => {
  res.json(res.comment);
});

// owner or top-admin can edit; set editedAt so the UI shows "(edited)"
const canEditOrTopAdmin = (comment, user) =>
  String(comment.author) === String(user.id) || user.adminLevel === 0;

async function applyCommentEdit(req, res) {
  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Content is required.' });

  if (!canEditOrTopAdmin(res.comment, req.user)) {
    return res.status(403).json({ message: 'You can only edit your own comment.' });
  }

  res.comment.content = content;
  res.comment.editedAt = new Date(); // <-- important for the UI
  await res.comment.save();

  const populated = await res.comment.populate('author', 'profile.firstName profile.lastName');
  res.json(populated);
}

router.patch('/:id', auth, getComment, applyCommentEdit);
router.put('/:id', auth, getComment, applyCommentEdit); // accept PUT too

// Delete a specific comment by ID
router.delete('/:id', auth, getComment, async (req, res) => {
  const isOwner = String(res.comment.author) === String(req.user.id);
  const isTopAdmin = req.user.adminLevel === 0;
  if (!isOwner && !isTopAdmin) {
    return res.status(403).json({ message: 'You can only delete your own comment.' });
  }
  try {
    await res.comment.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle like/unlike a comment
router.post('/:id/like', auth, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId).select('author likes referencedPost');
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const already = comment.likes.some(id => String(id) === String(userId));
    if (already) {
      // Unlike
      comment.likes.pull(userId);
      await comment.save();
      return res.json({ liked: false, likesCount: comment.likes.length });
    }

    // Like
    comment.likes.addToSet(userId);
    await comment.save();

    // Notify the comment author (avoid self-notify)
    if (String(comment.author) !== String(userId)) {
      // upsert-style: avoid duplicate like notifications from same actor on same comment
      const exists = await Notification.findOne({
        user: comment.author,
        actor: userId,
        comment: comment._id,
        type: 'comment_like',
      });

      if (!exists) {
        const recipient = await User.findById(post.author).select('settings push');
        if (recipient?.settings?.notifications === false) {
          // user turned off notifications entirely
        } else {
          // create Notification + socket emit + push send
        }

        const { sendExpoPush } = require('../../utils/expoPush');

        if (recipient?.settings?.notifications !== false) {
          const notif = await Notification.create({ ... });

          const io = req.app.get('io');
          io?.to(`user:${post.author}`).emit('notification:new', ...);

          await sendExpoPush(recipient.push?.expoTokens, {
            title: 'New comment',
            body: `${user.profile.firstName} commented on your post`,
            data: { type: 'comment', postId: String(postId) },
          });
        }

        const notif = await Notification.create({
          user: comment.author,        // recipient (comment owner)
          actor: userId,               // the one who liked
          type: 'comment_like',
          post: comment.referencedPost,
          comment: comment._id,
        });

        // include basic actor profile in the socket payload
        const actor = await User.findById(userId).select('profile.firstName profile.lastName profile.avatarUrl');

        const io = req.app.get('io');
        io?.to(`user:${comment.author}`).emit('notification:new', {
          _id: notif._id,
          type: 'comment_like',
          createdAt: notif.createdAt,
          actor: { _id: userId, profile: actor?.profile },
          post: { _id: String(comment.referencedPost) },
          comment: { _id: String(comment._id) },
        });
      }
    }

    res.json({ liked: true, likesCount: comment.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Has current user liked this comment?
router.get('/:id/liked', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).select('likes');
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const liked = comment.likes.some(id => String(id) === String(req.user.id));
    res.json({ liked, likesCount: comment.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;