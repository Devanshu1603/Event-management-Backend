const express = require("express");
const multer = require("multer");
const router = express.Router();
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const { protect } = require("../middleware/authMiddleware");

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Get user profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// ✅ Update user profile with Cloudinary
router.put("/profile", protect, upload.single("profileImage"), async (req, res) => {
  try {
    const { name, email, phone, address, bio } = req.body;
    const updatedData = { name, email, phone, address, bio };

    // Upload to Cloudinary if a new image is provided
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "user_profiles" },
          (error, cloudinaryResult) => {
            if (error) reject(error);
            else resolve(cloudinaryResult);
          }
        ).end(req.file.buffer);
      });

      updatedData.profileImage = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updatedData, { new: true });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error updating profile" });
  }
});

module.exports = router;
