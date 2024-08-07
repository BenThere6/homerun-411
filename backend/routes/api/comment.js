const express = require('express');
const router = express.Router();
const Comment = require('../../models/Comment');
const auth = require('../../middleware/auth');

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

// Update a specific comment by ID
router.patch('/:id', auth, getComment, async (req, res) => {
  if (req.body.content != null) {
    res.comment.content = req.body.content;
  }
  res.comment.updatedAt = Date.now();

  try {
    const updatedComment = await res.comment.save();
    res.json(updatedComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific comment by ID
router.delete('/:id', auth, getComment, async (req, res) => {
  try {
    const deletedComment = await Comment.findByIdAndDelete(req.params.id);
    if (!deletedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.json({ message: 'Comment deleted successfully', deletedComment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;