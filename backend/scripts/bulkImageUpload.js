const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const readline = require("readline-sync");
require('dotenv').config({ path: '../.env' });

const Park = require("../models/Park");
const ImageCategory = require("../models/ImageCategory");

// Console colors
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const WHITE = "\x1b[37m";
const RESET = "\x1b[0m";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const rootFolder = path.join(
    process.env.HOME || process.env.USERPROFILE,
    "Documents",
    "HR411 Park Images"
);

const uploadedById = "679e4a5f1b62627edb5266a5"; // your admin user ID

async function uploadImages() {
    const parks = await Park.find();
    const skippedParks = [];

    for (const parkFolderName of fs.readdirSync(rootFolder)) {
        const parkPath = path.join(rootFolder, parkFolderName);
        if (!fs.statSync(parkPath).isDirectory()) continue;

        const park = parks.find(
            (p) => p.name.trim().toLowerCase() === parkFolderName.trim().toLowerCase()
        );

        if (!park) {
            console.error(`${RED}❌ Park not found in DB: ${parkFolderName}${RESET}`);
            skippedParks.push({ parkName: parkFolderName, reason: "Name mismatch" });
            continue;
        }

        const categoryFolders = fs.readdirSync(parkPath).filter((f) =>
            fs.statSync(path.join(parkPath, f)).isDirectory()
        );

        let mainImageSet = false;

        for (let i = 0; i < categoryFolders.length; i++) {
            let categoryName = categoryFolders[i];
            const categoryPath = path.join(parkPath, categoryName);

            let category = await ImageCategory.findOne({ name: categoryName });

            if (!category) {
                const existingCategories = await ImageCategory.find().sort("name");
                const existingNames = existingCategories.map(cat => cat.name);

                console.log(`${RED}⚠️  Category "${categoryName}" not found in database.${RESET}`);

                const options = [...existingNames, `➕ Use new: "${categoryName}"`, "✏️ Enter a custom name"];
                const selected = readline.keyInSelect(options, `${WHITE}Select category to use for "${categoryName}":${RESET}`, { cancel: false });

                let selectedName;
                if (options[selected] === "✏️ Enter a custom name") {
                    selectedName = readline.question(`${WHITE}Type your custom category name:${RESET} `).trim();
                } else if (options[selected].startsWith("➕")) {
                    selectedName = categoryName;
                } else {
                    selectedName = existingNames[selected];
                }

                category = await ImageCategory.findOne({ name: selectedName });

                if (!category) {
                    category = new ImageCategory({ name: selectedName });
                    await category.save();
                }

                categoryName = selectedName;
            }

            const imageFiles = fs
                .readdirSync(categoryPath)
                .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

            for (let j = 0; j < imageFiles.length; j++) {
                const filePath = path.join(categoryPath, imageFiles[j]);
                const result = await cloudinary.uploader.upload(filePath, {
                    folder: "user_uploads",
                    use_filename: true,
                });

                const newImage = {
                    url: result.secure_url,
                    label: category.name,
                    section: "",
                    uploadedBy: uploadedById,
                    uploadedAt: new Date(),
                    status: "approved",
                };

                if (!mainImageSet && j === 0 && i === 0) {
                    park.mainImageUrl = result.secure_url;
                    newImage.isCategoryMain = true;
                    mainImageSet = true;
                } else if (j === 0) {
                    newImage.isCategoryMain = true;
                }

                if (newImage.isCategoryMain) {
                    park.images.forEach((img) => {
                        if (img.label === category.name) {
                            img.isCategoryMain = false;
                        }
                    });
                }

                park.images.push(newImage);
                console.log(`${WHITE}⬆️ Uploaded ${filePath} → ${result.secure_url}${RESET}`);
            }
        }

        await park.save();
        console.log(`${GREEN}✅ Finished uploading to park: ${park.name}${RESET}`);
    }

    // Final Summary
    console.log("\n=== Upload Summary ===");
    if (skippedParks.length > 0) {
        console.log(`${RED}❌ Skipped Parks:${RESET}`);
        skippedParks.forEach(({ parkName, reason }) => {
            console.log(`${RED}- ${parkName}: ${reason}${RESET}`);
        });
    } else {
        console.log(`${GREEN}🎉 All parks processed successfully!${RESET}`);
    }

    mongoose.disconnect();
}

uploadImages().catch((err) => {
    console.error(`${RED}❌ Error in uploadImages():`, err, RESET);
    mongoose.disconnect();
});