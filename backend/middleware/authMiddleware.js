const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    // Authorization header check
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Access denied. No token provided",
      });
    }

    // Bearer TOKEN
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. Invalid token format",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // User information request me store
    req.user = decoded;

    // Next middleware/controller
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;