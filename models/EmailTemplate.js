const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  registration: {
    type: String,
    required: true
  },
  reminder: {
    type: String,
    required: true
  },
  attendance: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
