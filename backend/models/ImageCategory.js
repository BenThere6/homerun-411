// models/ImageCategory.js
const mongoose = require("mongoose");

const ImageCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("ImageCategory", ImageCategorySchema);