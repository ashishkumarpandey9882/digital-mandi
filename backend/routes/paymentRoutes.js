
const express = require("express");

const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Support either a direct middleware export or an object with protect
const protect = authMiddleware.protect || authMiddleware;

// Existing controller
const getPaymentDetails = paymentController.getPaymentDetails;

// New controller
const createPaymentOrder = paymentController.createPaymentOrder;
const verifyPayment = paymentController.verifyPayment;

// Get payment details for an order
router.get("/:orderId", protect, getPaymentDetails);

// Verify a Razorpay payment
router.post("/verify", protect, verifyPayment);

// Create a Razorpay payment order
router.post(
  "/create-order/:orderId",
  protect,
  createPaymentOrder
);

module.exports = router;
