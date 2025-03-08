const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// Ensure the "uploads" directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Store images in the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Serve uploaded images as static files
router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

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

// ✅ Update user profile
router.put("/profile", protect, upload.single("profileImage"), async (req, res) => {
  try {
    const { name, email, phone, address, bio } = req.body;
    
    // Prepare update data
    const updatedData = { name, email, phone, address, bio };

    // If a new profile image is uploaded, update profileImage field
    if (req.file) {
      updatedData.profileImage = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updatedData, { new: true });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ msg: "Error updating profile" });
  }
});

module.exports = router;
