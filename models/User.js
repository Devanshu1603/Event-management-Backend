const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // Empty for Admins
  role: { type: String, enum: ["user", "admin"], required: true },
});

module.exports = mongoose.model("User", userSchema);
