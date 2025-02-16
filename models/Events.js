const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // Storing time as string (e.g., "3:00 PM")
  venue: { type: String, required: true },
  posterImg: { type: String, required: true }, // URL of uploaded poster image
  description: { type: String, required: true },
  capacity: { type: Number, required: true }, // Max attendees
  prerequisites: { type: [String], required: true }, // Array of prerequisite strings
  organizer: { type: String, required: true }, // Name of organizer
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Registrations with status
  registrations: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true },
      email: { type: String, required: true },
      registeredAt: { type: Date, default: Date.now },
      status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
      attended: { type: Boolean, default: false } // New field to track attendance
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
