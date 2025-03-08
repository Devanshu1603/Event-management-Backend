const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "New User" },
    email: { type: String, unique: true, required: true },
    password: { type: String }, // Empty for Admins
    role: { type: String, enum: ["user", "admin"], required: true },

    // User profile details with default values
    phone: { type: String, default: "Not Provided" },
    address: { type: String, default: "Not Provided" },
    bio: { type: String, default: "No bio available." },
    profileImage: { 
      type: String, 
      default: "https://via.placeholder.com/150" 
    },

    // Event-related data
    registeredEvents: [
      {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        registeredAt: { type: Date, default: Date.now },
      }
    ],
    completedEvents: [
      {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        completedAt: { type: Date, default: Date.now },
      }
    ],
    rating: { type: Number, default: 0 },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt fields
);

module.exports = mongoose.model("User", userSchema);
