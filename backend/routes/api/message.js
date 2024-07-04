const express = require('express');
const router = express.Router();
const Message = require('../../models/Message');
const auth = require('../../middleware/auth');

// Middleware function to fetch a message by ID
async function getMessage(req, res, next) {
  let message;
  try {
    message = await Message.findById(req.params.id);
    if (message == null) {
      return res.status(404).json({ message: 'Message not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.message = message;
  next();
}

// Create a new message
router.post('/', auth, async (req, res) => {
  try {
    const { sender, receiver, content, referencedItem } = req.body;
    const newMessage = new Message({
      sender,
      receiver,
      content,
      referencedItem,
    });
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all messages
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    // Assuming authentication middleware sets req.user with the logged-in user's data
    const conversations = await Message.distinct('sender', { receiver: req.user.id })
      .populate('sender')
      .exec();

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific message by ID
router.get('/:id', auth, getMessage, (req, res) => {
  res.json(res.message);
});

// Update a specific message by ID
router.patch('/:id', auth, getMessage, async (req, res) => {
  if (req.body.sender != null) {
    res.message.sender = req.body.sender;
  }
  if (req.body.receiver != null) {
    res.message.receiver = req.body.receiver;
  }
  if (req.body.content != null) {
    res.message.content = req.body.content;
  }
  if (req.body.referencedItem != null) {
    res.message.referencedItem = req.body.referencedItem;
  }

  try {
    res.message.updatedAt = Date.now();
    const updatedMessage = await res.message.save();
    res.json(updatedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /:messageId/mark-read
router.patch('/:messageId/mark-read', auth, async (req, res) => {
  try {
    const messageId = req.params.messageId;

    // Assuming authentication middleware sets req.user with the logged-in user's data
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.read = true;
    message.updatedAt = Date.now();

    const updatedMessage = await message.save();
    res.json(updatedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific message by ID
router.delete('/:id', auth, getMessage, async (req, res) => {
  try {
    const deletedMessage = await Message.findByIdAndDelete(req.params.id);
    if (!deletedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Message deleted successfully', deletedMessage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;