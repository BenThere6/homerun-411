import cloudinary from "../config/cloudinaryConfig";

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_preset"); // Use your actual upload preset

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    console.log("Uploaded Image URL:", data.secure_url);
    return data.secure_url; // This is the image URL stored in Cloudinary
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

export default uploadImage;
