
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Access denied. No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. Invalid token format",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// Farmer-only authorization
const farmerOnly = (req, res, next) => {
  if (req.user?.role !== "farmer") {
    return res.status(403).json({
      message: "Access denied. Only farmers are allowed",
    });
  }

  next();
};

module.exports = protect;
module.exports.farmerOnly = farmerOnly;
