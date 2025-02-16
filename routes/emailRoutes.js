const express = require('express');
const router = express.Router();

// Assuming you have a model for storing email templates
const EmailTemplate = require('../models/EmailTemplate');

// GET route to fetch email templates from the database
router.get('/email-templates', async (req, res) => {
  try {
    const templates = await EmailTemplate.findOne(); // Fetch the templates from the DB
    if (!templates) {
      // If no templates exist, send default ones
      return res.status(200).json({
        registration: "Dear [User],\nThank you for registering for [Event Name]. We look forward to seeing you on [Date] at [Venue].\n\nBest Regards,\n[Organizer Name]",
        reminder: "Hello [User],\nThis is a reminder for the upcoming event [Event Name] happening on [Date] at [Time] in [Venue].\n\nSee you there!",
        attendance: "Hi [User],\nYour attendance for [Event Name] has been successfully recorded. Thank you for participating!\n\nBest Regards,\n[Organizer Name]"
      });
    }
    res.status(200).json(templates); // Send the templates from the DB
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ message: 'Failed to fetch email templates.' });
  }
});

// PUT route to save updated email templates to the database
router.put('/email-templates', async (req, res) => {
  try {
    const { registration, reminder, attendance } = req.body;

    // Check if templates already exist, then update
    let templates = await EmailTemplate.findOne();
    if (!templates) {
      // If no templates exist, create a new one
      templates = new EmailTemplate({
        registration,
        reminder,
        attendance
      });
    } else {
      // Update the existing templates
      templates.registration = registration;
      templates.reminder = reminder;
      templates.attendance = attendance;
    }

    await templates.save(); // Save to the database
    res.status(200).json({ message: 'Email templates updated successfully!' });
  } catch (error) {
    console.error('Error saving email templates:', error);
    res.status(500).json({ message: 'Failed to save email templates.' });
  }
});

module.exports = router;
