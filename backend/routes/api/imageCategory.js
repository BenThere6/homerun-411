// routes/api/imageCategory.js
const express = require("express");
const router = express.Router();
const ImageCategory = require("../../models/ImageCategory");

// Get all image categories
router.get("/", async (req, res) => {
  try {
    const categories = await ImageCategory.find().sort("name");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

module.exports = router;
