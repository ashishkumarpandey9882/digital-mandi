
const express = require("express");
const protect = require("../middleware/authMiddleware");
const { chatWithAssistant } = require("../controllers/aiController");

const router = express.Router();

// AI tools use the authenticated user's identity.
router.post("/chat", protect, chatWithAssistant);

module.exports = router;
