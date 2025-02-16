const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register User or Admin
// Register User or Admin

exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    if (role === "user") {
      // Hash password for users
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword, role });
      await user.save();
      res.status(201).json({ message: "User registered successfully" });
    } else if (role === "admin") {
      // Generate random password for admin
      const adminPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = new User({ name, email, password: hashedPassword, role });
      await admin.save();

      // Send login details to admin email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Admin Account Created",
        text: `Your admin account has been created.\n\nEmail: ${email}\nPassword: ${adminPassword}`,
      };
      await transporter.sendMail(mailOptions);

      res.status(201).json({ message: "Admin registered. Login details sent to email." });
    }
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    if (role === "user") {
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);
      const user = new User({ name, email, password: hashedPassword, role });
      await user.save();
      return res.status(201).json({ message: "User registered successfully" });
    } else if (role === "admin") {
      const adminPassword = Math.random().toString(36).slice(-8);
      console.log(adminPassword);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = new User({ name, email, password: hashedPassword, role });
      await admin.save();

      // Send login details to admin email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Admin Account Created",
        text: `Your admin account has been created.\n\nEmail: ${email}\nPassword: ${adminPassword}`,
      };

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, // Your Gmail address
          pass: process.env.EMAIL_PASS, // App password (not your regular Gmail password)
        },
        tls: {
          rejectUnauthorized: false, // Disable certificate verification
        },
      });
      

      // Try sending the email and catch errors
      try {
        await transporter.sendMail(mailOptions);
        return res.status(201).json({ message: "Admin registered. Login details sent to email." });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return res.status(500).json({ error: "Admin registered, but email sending failed." });
      }
    }
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
};


// Login User or Admin
exports.loginUser = async (req, res) => {
  const { email, password,role } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    if (user.role !== role) {
      return res.status(403).json({ error: 'Unauthorized: Incorrect role' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    // Generate JWT Token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, role: user.role, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};
