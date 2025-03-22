// routes/api/upload.js

const express = require("express");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const authenticate = require("../../middleware/auth");
const isAdmin = require("../../middleware/isAdmin");
const Park = require("../../models/Park");
const ImageCategory = require("../../models/ImageCategory");

const router = express.Router();
router.use(fileUpload({ useTempFiles: true }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/", authenticate, isAdmin, async (req, res) => {
  try {
    const { parkId, categoryName, section, isMainImage, isCategoryMain } = req.body;

    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    if (!parkId || !categoryName) {
      return res.status(400).json({ message: "parkId and categoryName are required" });
    }

    const park = await Park.findById(parkId);
    if (!park) {
      return res.status(404).json({ message: "Park not found" });
    }

    // Check if category exists; if not, create it
    let category = await ImageCategory.findOne({ name: categoryName });
    if (!category) {
      category = new ImageCategory({ name: categoryName });
      await category.save();
    }

    const file = req.files.image;

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "user_uploads",
      use_filename: true,
    });

    const newImage = {
      url: result.secure_url,
      label: category.name,
      section: section || "",
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      status: "approved",
      isCategoryMain: isCategoryMain === "true" // Cast from string (form-data comes as string)
    };
    
    // If it's the main park image, set it
    if (isMainImage === "true") {
      park.mainImageUrl = result.secure_url;
    }
    
    // If it's the main image for the category, clear others
    if (isCategoryMain === "true") {
      park.images.forEach((img) => {
        if (img.label === category.name) {
          img.isCategoryMain = false;
        }
      });
      newImage.isCategoryMain = true;
    }
    
    park.images.push(newImage);
    await park.save();

    res.json({
      message: "Image uploaded and saved successfully",
      imageUrl: result.secure_url,
      parkId: park._id,
      category: category.name,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

module.exports = router;