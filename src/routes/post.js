const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment'); // Assuming Comment model is imported

// Middleware function to fetch post by ID
async function getPost(req, res, next) {
  let post;
  try {
    post = await Post.findById(req.params.id);
    if (post == null) {
      return res.status(404).json({ message: 'Post not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.post = post;
  next();
}

// Create a new post
router.post('/posts', auth, async (req, res) => {
  try {
    const { title, content, author, tags, referencedPark } = req.body;

    const newPost = new Post({
      title,
      content,
      author,
      tags,
      referencedPark,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /posts/:postId/comments
router.post('/posts/:postId/comments', auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const { content } = req.body;

    // Assuming authentication middleware sets req.user with the logged-in user's data
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const comment = new Comment({
      referencedPost: postId,
      content,
      author: req.user.id,
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /posts/recent
router.get('/posts/recent', async (req, res) => {
  try {
    const recentPosts = await Post.find().sort({ createdAt: -1 }).limit(10);

    res.json(recentPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /posts/search?tag={tag}
router.get('/posts/search', async (req, res) => {
  try {
    const tag = req.query.tag;
    const posts = await Post.find({ tags: tag });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get post by ID
router.get('/posts/:id', getPost, (req, res) => {
  res.json(res.post);
});

// Update post by ID
router.patch('/posts/:id', auth, getPost, async (req, res) => {
  if (req.body.title != null) {
    res.post.title = req.body.title;
  }
  if (req.body.content != null) {
    res.post.content = req.body.content;
  }
  if (req.body.tags != null) {
    res.post.tags = req.body.tags;
  }
  if (req.body.referencedPark != null) {
    res.post.referencedPark = req.body.referencedPark;
  }
  res.post.updatedAt = Date.now();

  try {
    const updatedPost = await res.post.save();
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete post by ID
router.delete('/posts/:id', auth, getPost, async (req, res) => {
  try {
    await res.post.remove();
    res.json({ message: 'Deleted post' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;