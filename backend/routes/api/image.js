const express = require('express');
const router = express.Router();
const Image = require('../../models/Image');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');

// Middleware function to fetch an image by ID
async function getImage(req, res, next) {
  let image;
  try {
    image = await Image.findById(req.params.id);
    if (image == null) {
      return res.status(404).json({ message: 'Image not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.image = image;
  next();
}

// Create a new image
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { park, category, url, description } = req.body;
    
    // Ensure category is valid
    const validCategories = [
      'firstBaseSideline',
      'thirdBaseSideline',
      'dugout',
      'concessions',
      'parking',
      'skyView',
      'other'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const image = new Image({ park, category, url, description });
    const savedImage = await image.save();
    res.status(201).json(savedImage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all images for a specific park and category
router.get('/:parkId/images', async (req, res) => {
  const { parkId } = req.params;
  const { category } = req.query; // Get the category from query parameters

  try {
    const images = await Image.find({
      park: parkId,
      category: category, // Example: 'firstBaseSideline'
    });

    if (!images.length) {
      return res.status(404).json({ message: 'No images found for this category and park' });
    }

    res.json(images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific image by ID
router.get('/:id', getImage, (req, res) => {
  res.json(res.image);
});

// Update a specific image by ID
router.patch('/:id', auth, isAdmin, getImage, async (req, res) => {
  const { url, description } = req.body;

  if (url != null) {
    res.image.url = url;
  }
  if (description != null) {
    res.image.description = description;
  }
  res.image.updatedAt = Date.now();

  try {
    const updatedImage = await res.image.save();
    res.json(updatedImage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a specific image by ID
router.delete('/:id', auth, isAdmin, getImage, async (req, res) => {
  try {
    const deletedImage = await Image.findByIdAndDelete(req.params.id);
    if (!deletedImage) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.json({ message: 'Image deleted successfully', deletedImage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;