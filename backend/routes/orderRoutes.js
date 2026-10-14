const express = require("express");

const {
  placeOrder,
  calculateOrderDistance,
  getMyOrders,
  getFarmerOrders,
  acceptOrder,
  rejectOrder,
} = require("../controllers/orderController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// CALCULATE DISTANCE
// Buyer gets transport estimate before placing order
// =====================================================
router.post(
  "/calculate-distance",
  protect,
  calculateOrderDistance
);

// =====================================================
// PLACE ORDER
// Only buyer can place an order
// =====================================================
router.post(
  "/",
  protect,
  placeOrder
);

// =====================================================
// BUYER ORDERS
// =====================================================
router.get(
  "/my-orders",
  protect,
  getMyOrders
);

// =====================================================
// FARMER ORDERS
// =====================================================
router.get(
  "/farmer-orders",
  protect,
  getFarmerOrders
);

// =====================================================
// ACCEPT ORDER
// =====================================================
router.put(
  "/:id/accept",
  protect,
  acceptOrder
);

// =====================================================
// REJECT ORDER
// =====================================================
router.put(
  "/:id/reject",
  protect,
  rejectOrder
);

module.exports = router;