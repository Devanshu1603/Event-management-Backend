// In eventRoutes.js
const express = require("express");
const { getEventById, createEvent, getAllEvents, getAdminEvents, registerForEvent, updateRegistrationStatus, getRegisteredUsers, markAttendance, getRegisteredEvents } = require("../controllers/eventController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");

const router = express.Router();

// Route to create a new event (Admin only) with image upload
router.post("/create", protect, adminOnly, upload.single("posterImg"), createEvent);

router.get("/registered-events", protect, getRegisteredEvents);

// Route to get all events (Accessible to all users)
router.get("/", getAllEvents);

// Route to get events created by the logged-in admin
router.get("/my-events", protect, adminOnly, getAdminEvents);

// Route to register for an event (User only)
router.post("/register/:eventId", protect, registerForEvent);

// Route to update registration status (Admin only)
router.put("/registration/:eventId/:email", protect, adminOnly, updateRegistrationStatus);

// Route to get registered users for a specific event (Admin only)
router.get("/registrations/:eventId", protect, adminOnly, getRegisteredUsers);

// Route to mark attendance for an event (User scans QR code)
router.post("/mark-attendance", protect, markAttendance); // New route

// Route to get event details by event ID
router.get('/:eventId', getEventById);

module.exports = router;
