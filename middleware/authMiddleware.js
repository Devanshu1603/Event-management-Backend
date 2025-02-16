const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token in backend:", token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token:", decoded);

      const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        return res.status(401).json({ error: "User not found!" });
      }

      req.user = { id: user._id.toString(), role: user.role }; // Ensuring string format
      console.log("Authenticated User:", req.user);

      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ error: "Not authorized, token failed!" });
    }
  } else {
    return res.status(401).json({ error: "Not authorized, no token!" });
  }
};

const adminOnly = (req, res, next) => {
  console.log("User Role:", req.user?.role);

  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied, Admins only!" });
  }
};

module.exports = { protect, adminOnly };