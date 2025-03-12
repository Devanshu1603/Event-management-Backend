const mongoose = require("mongoose");
const Event = require("../models/Events");
const nodemailer = require("nodemailer");
const EmailTemplate = require("../models/EmailTemplate");
const QRCode = require("qrcode");
const User = require('../models/User');
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary"); // Import Cloudinary

// Create a new event (Admin only)
const createEvent = async (req, res) => {
  try {
    const { title, date, time, venue, description, capacity, prerequisites, organizer } = req.body;

    if (!title || !date || !time || !venue || !description || !capacity || !prerequisites || !organizer) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Poster image is required" });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "event_posters", // Cloudinary folder
    });

    // Save event with Cloudinary image URL
    const event = new Event({
      title,
      date,
      time,
      venue,
      posterImg: result.secure_url, // Cloudinary image URL
      description,
      capacity,
      prerequisites: prerequisites.split(","), 
      organizer,
      createdBy: req.user.id,
    });

    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Error creating event", error: error.message });
  }
};


const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const eventDateUTC = new Date(event.date); // Event date in UTC

    // ✅ Convert event date to IST (only date part)
    const eventDateIST = new Date(eventDateUTC.getTime() + (5.5 * 60 * 60 * 1000));
    const eventDateStr = eventDateIST.toISOString().split("T")[0]; // Extract YYYY-MM-DD

    // ✅ Get today's date in IST (ignoring time)
    const nowUTC = new Date();
    const nowIST = new Date(nowUTC.getTime() + (5.5 * 60 * 60 * 1000));
    const todayISTStr = nowIST.toISOString().split("T")[0]; // Extract YYYY-MM-DD

    let status;
    if (eventDateStr > todayISTStr) {
      status = "upcoming";
    } else if (eventDateStr < todayISTStr) {
      status = "completed";
    } else {
      status = "ongoing"; // If today is the event date
    }

    res.json({
      ...event.toObject(),
      status, // Include event status
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Register a user for an event
const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email } = req.body;
  
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your actual secret key
    const userId = decoded.userId; // Extract user ID from token
    console.log("Decoded userId:", userId);
    console.log("Received eventId:", eventId);

    console.log('Registering for event:', eventId);
    console.log('Received data:', { name, email });

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if the user is already registered
    const alreadyRegistered = event.registrations.some(reg => reg.email === email);
    if (alreadyRegistered) {
      return res.status(400).json({ message: "You are already registered for this event" });
    }

    // Add user to registrations array
    event.registrations.push({ name, email });
    await event.save();

    user.registeredEvents.push(eventId);
    await user.save();

    console.log('Registration successful:', event);

    res.status(200).json({ message: "Registration successful", event });
  } catch (error) {
    console.error('Error during registration:', error); // Log the error
    res.status(500).json({ message: "Error registering for event", error: error.message });
  }
};

const getRegisteredEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user by ID
    const user = await User.findById(userId).populate({
      path: "registeredEvents",
      model: "Event", // Make sure this matches your Event model name
    });
        console.log("useridre:- ", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ registeredEvents: user.registeredEvents});
  } catch (error) {
    res.status(500).json({ message: "Error fetching registered events", error: error.message });
  }
};



// Get all events
// const getAllEvents = async (req, res) => {
//   try {
//     const events = await Event.find().sort({ date: 1 });
//     const baseUrl = `${req.protocol}://${req.get("host")}`;
//     const today = new Date();
//     console.log("today",today);

//     const updatedEvents = events.map(event => {
//       const eventDate = new Date(event.date);
//       console.log("eventDate",eventDate);
//       const status = eventDate < today ? "ongoing" : "upcoming";  // Determine status

//       return {
//         ...event.toObject(),
//         status,
//         posterImg: event.posterImg.startsWith("http") ? event.posterImg : `${baseUrl}${event.posterImg}`
//       };
//     });

//     res.status(200).json(updatedEvents);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching events", error: error.message });
//   }
// };

// Get events created by the logged-in admin

const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();

    const updatedEvents = events.map(event => {
      const eventDateUTC = new Date(event.date); // Event date in UTC

      // ✅ Convert event date to IST (only date part)
      const eventDateIST = new Date(eventDateUTC.getTime() + (5.5 * 60 * 60 * 1000));
      const eventDateStr = eventDateIST.toISOString().split("T")[0]; // Extract YYYY-MM-DD

      // ✅ Get today's date in IST (ignoring time)
      const nowUTC = new Date();
      const nowIST = new Date(nowUTC.getTime() + (5.5 * 60 * 60 * 1000));
      const todayISTStr = nowIST.toISOString().split("T")[0]; // Extract YYYY-MM-DD

      // ✅ Compare only the date (not time)
      let status;
      if (eventDateStr > todayISTStr) {
        status = "upcoming";
      }

      else if(eventDateStr < todayISTStr){
          status = "completed";
      }
       
       else {
        status = "ongoing"; // If today is the event date
      }

      console.log("status",status);

      return {
        ...event._doc,
        eventDateIST: eventDateStr, // Send IST date only (YYYY-MM-DD)
        status, // Updated status based on date
      };
    });

    res.status(200).json(updatedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Error fetching events", error: error.message });
  }
};


const getAdminEvents = async (req, res) => {
  try {
    const adminId = req.user.id;
    console.log(adminId);
    const events = await Event.find({ createdBy: adminId }).sort({ date: 1 });
    console.log(events);
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const updatedEvents = events.map(event => {
      const eventDateUTC = new Date(event.date); // Event date in UTC

      // ✅ Convert event date to IST (only date part)
      const eventDateIST = new Date(eventDateUTC.getTime() + (5.5 * 60 * 60 * 1000));
      const eventDateStr = eventDateIST.toISOString().split("T")[0]; // Extract YYYY-MM-DD

      // ✅ Get today's date in IST (ignoring time)
      const nowUTC = new Date();
      const nowIST = new Date(nowUTC.getTime() + (5.5 * 60 * 60 * 1000));
      const todayISTStr = nowIST.toISOString().split("T")[0]; // Extract YYYY-MM-DD
      let status;
      if (eventDateStr > todayISTStr) {
        status = "upcoming";
      }

      else if(eventDateStr < todayISTStr){
          status = "completed";
      }
       
       else {
        status = "ongoing"; // If today is the event date
      }

      return {
        ...event.toObject(),
        status,
        posterImg: event.posterImg.startsWith("http") ? event.posterImg : `${baseUrl}${event.posterImg}`,
        registrations: event.registrations // Include registrations
      };
    });

    console.log(updatedEvents);

    res.status(200).json(updatedEvents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin events", error: error.message });
  }
};



const updateRegistrationStatus = async (req, res) => {
  try {
    const { eventId, email } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const registration = event.registrations.find((reg) => reg.email === email);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    registration.status = status;
    await event.save();

    // If approved, send confirmation email with QR code
    if (status === "Approved") {
      const emailTemplate = await EmailTemplate.findOne();
      const registrationTemplate = emailTemplate
        ? emailTemplate.registration
        : `Dear ${registration.name},\n\nYour registration for ${event.title} has been approved!\nEvent Details:\nDate: ${event.date}\nVenue: ${event.venue}\n\nBest Regards,\n${event.organizer}`;

      // Generate a unique QR code for attendance
      const qrData = JSON.stringify({
        email: registration.email,
        eventId: event._id,
        name: registration.name,
        status: "Approved",
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData);

      // Email Transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER, // Your Gmail
          pass: process.env.EMAIL_PASS, // App Password (Not Gmail password)
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Registration Approved - " + event.title,
        html: `
          <p>Dear ${registration.name},</p>
          <p>Your registration for <strong>${event.title}</strong> has been approved!</p>
          <p><strong>Event Details:</strong></p>
          <p><b>Date:</b> ${event.date}</p>
          <p><b>Venue:</b> ${event.venue}</p>
          <p>Please find your unique QR code attached. You can use this QR code for marking your attendance at the event.</p>
          <p>Best Regards,</p>
          <p>${event.organizer}</p>
        `,
        attachments: [
          {
            filename: "QR_Code.png",
            content: qrCodeDataUrl.split(",")[1], // Extract base64 part
            encoding: "base64",
          },
        ],
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ message: "Registration status updated", event });
  } catch (error) {
    console.error("Error updating registration status:", error);
    res.status(500).json({ message: "Error updating registration status", error: error.message });
  }
};


// Get registered users for an event
const getRegisteredUsers = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ registrations: event.registrations });
  } catch (error) {
    res.status(500).json({ message: "Error fetching registered users", error: error.message });
  }
};


// In eventController.js

const markAttendance = async (req, res) => {
  try {
    const { eventId, email } = req.body; // Expect eventId and email from the QR scan
    if (!eventId || !email) {
      return res.status(400).json({ message: "Event ID and email are required" });
    }

    // Find the event by ID
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the user is registered for the event
    const registration = event.registrations.find((reg) => reg.email === email);
    if (!registration) {
      return res.status(404).json({ message: "User not registered for this event" });
    }

    // Mark attendance (You can add a new field like 'attended' to the registration)
    if (registration.attended) {
      return res.status(200).json({ message: "Attendance already marked for this user" });
    }

    registration.attended = true;
    await event.save(); // Save the updated event document

    res.status(200).json({ message: "Attendance marked successfully", registration });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Error marking attendance", error: error.message });
  }
};
module.exports = { getEventById,createEvent, getAllEvents, getAdminEvents, registerForEvent, updateRegistrationStatus, getRegisteredUsers, markAttendance, getRegisteredEvents};
