const express = require("express");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const authenticate = require("../../middleware/auth"); // Ensure this exists

const router = express.Router();

// Enable file uploads
router.use(fileUpload({ useTempFiles: true }));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Secure Image Upload Route (Requires Authentication)
router.post("/", authenticate, async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const file = req.files.image;

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "user_uploads",
      use_filename: true,
    });

    res.json({
      message: "Image uploaded successfully",
      imageUrl: result.secure_url,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

module.exports = router;