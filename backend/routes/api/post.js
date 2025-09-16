const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Types } = mongoose;
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');
const Notification = require('../../models/Notification');

// Middleware function to fetch post by ID
async function getPost(req, res, next) {
  let post;
  try {
    post = await Post.findById(req.params.id)
      .populate('author', 'profile.firstName profile.lastName profile.avatarUrl')
      .populate('referencedPark', 'name city state');
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
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, referencedPark } = req.body;
    const referencedParkId = referencedPark && (referencedPark._id || referencedPark);

    const newPost = new Post({
      title,
      content,
      author: req.user.id, // enforce authenticated user as author
      tags,
      referencedPark: referencedParkId || undefined,
    });

    const savedPost = await newPost.save();
    await savedPost.populate('author', 'profile.firstName profile.lastName profile.avatarUrl');
    await savedPost.populate('referencedPark', 'name city state');
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all comments for a specific post (sorted + author name)
router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ referencedPost: postId })
      .sort({ createdAt: 1 })
      .populate('author', 'profile.firstName profile.lastName');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a comment to a post (return populated author)
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const [user, post] = await Promise.all([
      User.findById(req.user.id).select('profile.firstName profile.lastName profile.avatarUrl'),
      Post.findById(postId).select('author title'),
    ]);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      referencedPost: postId,
      content,
      author: req.user.id,
    });

    const populated = await comment.populate('author', 'profile.firstName profile.lastName');

    // create notification for post owner (avoid self-notify)
    if (String(post.author) !== String(req.user.id)) {
      const notif = await Notification.create({
        user: post.author,
        actor: req.user.id,
        type: 'comment',
        post: postId,
        comment: comment._id,
      });

      // emit to the post owner’s room
      const io = req.app.get('io');
      io?.to(`user:${post.author}`).emit('notification:new', {
        _id: notif._id,
        type: 'comment',
        createdAt: notif.createdAt,
        actor: { _id: req.user.id, profile: user.profile },
        post: { _id: postId, title: post.title },
        comment: { _id: comment._id, content: comment.content },
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle like/unlike a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId).select('likes author title');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const already = post.likes.some(id => id.equals(userId));
    if (already) {
      post.likes.pull(userId);
      await post.save();
      return res.json({ liked: false, likesCount: post.likes.length });
    }

    post.likes.push(userId);
    await post.save();

    // Notify only when a new like happens, and not for self
    if (String(post.author) !== String(userId)) {
      // upsert style: find-or-create to avoid dupes
      const exists = await Notification.findOne({
        user: post.author,
        actor: userId,
        post: postId,
        type: 'like',
      });
      if (!exists) {
        const notif = await Notification.create({
          user: post.author,
          actor: userId,
          type: 'like',
          post: postId,
        });

        const actor = await User.findById(userId).select('profile.firstName profile.lastName profile.avatarUrl');

        const io = req.app.get('io');
        io?.to(`user:${post.author}`).emit('notification:new', {
          _id: notif._id,
          type: 'like',
          createdAt: notif.createdAt,
          actor: { _id: userId, profile: actor?.profile },
          post: { _id: postId, title: post.title },
        });
      }
    }

    res.json({ liked: true, likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check if current user liked this post
router.get('/:postId/liked', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId).select('likes');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const liked = post.likes.some(id => id.equals(userId));
    res.json({ liked, likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all posts
router.get('/', async (req, res) => {
  try {
    const { referencedPark, pinned, sort = 'newest' } = req.query;

    const query = {};
    if (referencedPark) {
      const id = String(referencedPark);
      if (Types.ObjectId.isValid(id)) {
        query.$or = [
          { referencedPark: new Types.ObjectId(id) },
          { 'referencedPark._id': new Types.ObjectId(id) },
        ];
      } else {
        query.$or = [
          { referencedPark: id },
          { 'referencedPark._id': id },
        ];
      }
    }
    if (String(pinned) === 'true') query.pinned = true;

    const baseSort = { pinned: -1, pinnedAt: -1, createdAt: -1 };

    let posts = await Post.find(query)
      .sort(baseSort)
      .populate('author', 'profile')
      .populate('referencedPark', 'name city state')
      .lean();

    // counts
    const commentCounts = await Promise.all(
      posts.map(p => Comment.countDocuments({ referencedPost: p._id }))
    );
    posts.forEach((p, i) => {
      p.likesCount = (p.likes?.length || 0);
      p.commentsCount = commentCounts[i] || 0;
    });

    // Flag posts that have any edited comments so the client can show "(edited)"
    const editedFlags = await Promise.all(
      posts.map(p => Comment.exists({
        referencedPost: p._id,
        $expr: { $gt: ['$updatedAt', '$createdAt'] }
      }))
    );
    posts.forEach((p, i) => { p.anyEdited = !!editedFlags[i]; });

    // additional sorting (keeps pinned first)
    if (sort === 'liked' || sort === 'comments') {
      const key = sort === 'liked' ? 'likesCount' : 'commentsCount';
      const pinnedPosts = posts.filter(p => p.pinned);
      const otherPosts = posts.filter(p => !p.pinned);
      pinnedPosts.sort((a, b) => (b[key] || 0) - (a[key] || 0));
      otherPosts.sort((a, b) => (b[key] || 0) - (a[key] || 0));
      posts = [...pinnedPosts, ...otherPosts];
    } else {
      // 'newest' already satisfied by baseSort
    }

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get recent posts
router.get('/recent', async (req, res) => {
  try {
    const recentPosts = await Post.find().sort({ createdAt: -1 }).limit(10);
    res.json(recentPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search posts by tag
router.get('/search', async (req, res) => {
  try {
    const tag = req.query.tag;
    const posts = await Post.find({ tags: tag });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pin a post (admin 0 or 1)
router.post('/:id/pin', auth, isAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.pinned = true;
    post.pinnedAt = new Date();
    post.pinnedBy = req.user.id;
    post.updatedAt = new Date();
    await post.save();

    res.json({ pinned: true, pinnedAt: post.pinnedAt, pinnedBy: post.pinnedBy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unpin a post
// - adminLevel 0: can unpin any
// - adminLevel 1: can unpin only if they are the one who pinned it
router.post('/:id/unpin', auth, isAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('pinned pinnedAt pinnedBy');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const level = req.user.adminLevel;
    const isOwnerOfPin = String(post.pinnedBy || '') === String(req.user.id);

    if (level === 0 || (level === 1 && isOwnerOfPin)) {
      post.pinned = false;
      post.pinnedAt = null;
      post.pinnedBy = null;
      post.updatedAt = new Date();
      await post.save();
      return res.json({ pinned: false });
    }

    return res.status(403).json({ message: 'Only top admins can unpin others’ posts.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get post by ID
router.get('/:id', getPost, (req, res) => {
  res.json(res.post);
});

function ensureOwnerOrAdmin(req, res, next) {
  const level = Number(req.user?.adminLevel);
  // res.post.author may be an ObjectId or a populated object
  const authorId = res.post?.author?._id
    ? String(res.post.author._id)
    : String(res.post.author);

  const isOwner = authorId === String(req.user.id);
  if (isOwner || level === 0) return next();

  return res.status(403).json({ message: 'You can only modify or delete your own post.' });
}

// Update post by ID
router.patch('/:id', auth, getPost, ensureOwnerOrAdmin, async (req, res) => {
  const updateFields = ['title', 'content', 'tags', 'referencedPark'];

  updateFields.forEach(field => {
    if (req.body[field] != null) {
      res.post[field] = req.body[field];
    }
  });

  const now = new Date();
  res.post.updatedAt = now;
  res.post.editedAt = now;

  try {
    const updatedPost = await res.post.save();
    await updatedPost.populate('author', 'profile.firstName profile.lastName profile.avatarUrl');
    await updatedPost.populate('referencedPark', 'name city state');
    res.json(updatedPost);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete post by ID
router.delete('/:id', auth, getPost, ensureOwnerOrAdmin, async (req, res) => {
  try {
    // Delete the post, and all related comments + notifications at the same time
    await Promise.all([
      res.post.deleteOne(),
      Comment.deleteMany({ referencedPost: res.post._id }),
      Notification.deleteMany({ post: res.post._id }),
    ]);

    return res.json({ 
      message: 'Post and related data deleted successfully', 
      deletedPostId: res.post._id 
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;