const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token with debug logging
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    console.log("[AUTH] Incoming token:", token);

    if (!token) {
      console.log("[AUTH] No token provided");
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log("[AUTH] JWT verification failed:", err.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
        error: err.message
      });
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("[AUTH] User not found for id:", decoded.userId);
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    if (user.isActive === false) {
      console.log("[AUTH] User is deactivated:", user._id);
      return res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during authentication.",
      error: error.message
    });
  }
};

const requireChef = (req, res, next) => {
  if (req.user && req.user.role === "chef") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Chef role required." });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin role required." });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        // Token is invalid or expired, but we still proceed without user info
        next();
      } else {
        User.findById(decoded.userId).select("-password")
          .then(user => {
            req.user = user;
            next();
          })
          .catch(err => {
            console.error("Error fetching user in optionalAuth:", err);
            next(); // Proceed even if user fetching fails
          });
      }
    });
  } else {
    next(); // No token, proceed without user info
  }
};

module.exports = { authenticateToken, requireChef, requireAdmin, optionalAuth };
