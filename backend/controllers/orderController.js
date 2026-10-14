const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const MSP = require("../models/MSP");
const calculateDistance = require("../utils/distance");

// =====================================================
// PLACE ORDER
// Only buyer can place an order
// =====================================================
const placeOrder = async (req, res) => {
  try {
    const {
      productId,
      quantity,
      deliveryLocation,
    } = req.body;

    // ===============================
    // VALIDATE PRODUCT ID
    // ===============================
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    // ===============================
    // CHECK BUYER ROLE
    // ===============================
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can place orders",
      });
    }

    // ===============================
    // FIND PRODUCT
    // ===============================
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // ===============================
    // CHECK PRODUCT AVAILABILITY
    // ===============================
    if (product.status !== "available") {
      return res.status(400).json({
        message: "Product is not available",
      });
    }

    // ===============================
    // CHECK QUANTITY
    // ===============================
    const orderQuantity = Number(quantity);

    if (
      !Number.isFinite(orderQuantity) ||
      orderQuantity <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    if (orderQuantity > product.quantity) {
      return res.status(400).json({
        message: "Requested quantity is not available",
        availableQuantity: product.quantity,
      });
    }

    // ===============================
    // VALIDATE BUYER LOCATION
    // ===============================
    if (!deliveryLocation) {
      return res.status(400).json({
        message: "Delivery location is required",
      });
    }

    const buyerLatitude = Number(
      deliveryLocation.latitude
    );

    const buyerLongitude = Number(
      deliveryLocation.longitude
    );

    if (
      !Number.isFinite(buyerLatitude) ||
      !Number.isFinite(buyerLongitude)
    ) {
      return res.status(400).json({
        message: "Invalid delivery location",
      });
    }

    // Latitude range: -90 to 90
    // Longitude range: -180 to 180
    if (
      buyerLatitude < -90 ||
      buyerLatitude > 90 ||
      buyerLongitude < -180 ||
      buyerLongitude > 180
    ) {
      return res.status(400).json({
        message: "Invalid delivery location coordinates",
      });
    }

    // ===============================
    // VALIDATE FARMER LOCATION
    // ===============================
    if (
      !product.location ||
      product.location.latitude === undefined ||
      product.location.longitude === undefined
    ) {
      return res.status(400).json({
        message:
          "Farmer location is not available for this product",
      });
    }

    const farmerLatitude = Number(
      product.location.latitude
    );

    const farmerLongitude = Number(
      product.location.longitude
    );

    if (
      !Number.isFinite(farmerLatitude) ||
      !Number.isFinite(farmerLongitude)
    ) {
      return res.status(400).json({
        message: "Invalid farmer location",
      });
    }

    if (
      farmerLatitude < -90 ||
      farmerLatitude > 90 ||
      farmerLongitude < -180 ||
      farmerLongitude > 180
    ) {
      return res.status(400).json({
        message: "Invalid farmer location coordinates",
      });
    }

    // ===============================
    // FIND CURRENT ACTIVE MSP
    // ===============================
    const cropName = product.cropName.trim();

    // Escape special regex characters
    const escapedCropName = cropName.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const msp = await MSP.findOne({
      cropName: {
        $regex: `^${escapedCropName}$`,
        $options: "i",
      },
      isActive: true,
    }).sort({
      year: -1,
      effectiveFrom: -1,
    });

    // ===============================
    // MSP NOT FOUND
    // ===============================
    if (!msp) {
      return res.status(400).json({
        message: "Current MSP not found for this crop",
      });
    }

    // ===============================
    // CALCULATE DISTANCE
    // ===============================
    const distance = calculateDistance(
      farmerLatitude,
      farmerLongitude,
      buyerLatitude,
      buyerLongitude
    );

    // ===============================
    // TRANSPORTATION COST
    // ===============================
    // Temporary MVP rate
    const transportRatePerKm = 10;

    const transportationCost = Math.round(
      distance * transportRatePerKm
    );

    // ===============================
    // TRANSPORTATION SHARING
    // ===============================
    const buyerTransportShare =
      transportationCost / 2;

    const farmerTransportShare =
      transportationCost / 2;

    // ===============================
    // CURRENT MSP PRICE
    // ===============================
    const mspPrice = Number(msp.mspPrice);

    if (
      !Number.isFinite(mspPrice) ||
      mspPrice <= 0
    ) {
      return res.status(400).json({
        message: "Invalid MSP price",
      });
    }

    // ===============================
    // CROP AMOUNT
    // ===============================
    const cropAmount =
      orderQuantity * mspPrice;

    // ===============================
    // FINAL AMOUNT
    // ===============================
    const totalAmount =
      cropAmount + buyerTransportShare;

    // ===============================
    // FARMER
    // ===============================
    const farmerId = product.farmer;

    // ===============================
    // CREATE ORDER
    // ===============================
    const order = await Order.create({
      buyer: req.user.id,
      farmer: farmerId,
      product: productId,
      quantity: orderQuantity,
      mspPrice,
      cropAmount,
      transportationCost,
      buyerTransportShare,
      farmerTransportShare,
      totalAmount,
      deliveryLocation: {
        latitude: buyerLatitude,
        longitude: buyerLongitude,
      },
      distance,
      status: "pending",
    });

    // ===============================
    // RESPONSE
    // ===============================
    return res.status(201).json({
      message: "Order placed successfully",

      order,

      currentMsp: {
        price: msp.mspPrice,
        unit: msp.unit,
        season: msp.season,
        year: msp.year,
      },

      distance: `${distance} km`,

      transportationCost,

      buyerTransportShare,

      farmerTransportShare,
    });

  } catch (error) {
    console.error(
      "Place Order Error:",
      error
    );

    return res.status(500).json({
      message: "Order creation failed",
      error: error.message,
    });
  }
};


// =====================================================
// CALCULATE ORDER DISTANCE
// Used by frontend to show transport estimate
// =====================================================
const calculateOrderDistance = async (req, res) => {
  try {
    const {
      productId,
      deliveryLocation,
    } = req.body;

    // ===============================
    // VALIDATE PRODUCT ID
    // ===============================
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    // ===============================
    // CHECK BUYER ROLE
    // ===============================
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message:
          "Only buyers can calculate order distance",
      });
    }

    // ===============================
    // FIND PRODUCT
    // ===============================
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // ===============================
    // VALIDATE DELIVERY LOCATION
    // ===============================
    if (!deliveryLocation) {
      return res.status(400).json({
        message: "Delivery location is required",
      });
    }

    const buyerLatitude = Number(
      deliveryLocation.latitude
    );

    const buyerLongitude = Number(
      deliveryLocation.longitude
    );

    if (
      !Number.isFinite(buyerLatitude) ||
      !Number.isFinite(buyerLongitude)
    ) {
      return res.status(400).json({
        message: "Invalid delivery location",
      });
    }

    // ===============================
    // VALIDATE COORDINATE RANGE
    // ===============================
    if (
      buyerLatitude < -90 ||
      buyerLatitude > 90 ||
      buyerLongitude < -180 ||
      buyerLongitude > 180
    ) {
      return res.status(400).json({
        message:
          "Invalid delivery location coordinates",
      });
    }

    // ===============================
    // CHECK FARMER LOCATION
    // ===============================
    if (
      !product.location ||
      product.location.latitude === undefined ||
      product.location.longitude === undefined
    ) {
      return res.status(400).json({
        message:
          "Farmer location is not available for this product",
      });
    }

    const farmerLatitude = Number(
      product.location.latitude
    );

    const farmerLongitude = Number(
      product.location.longitude
    );

    if (
      !Number.isFinite(farmerLatitude) ||
      !Number.isFinite(farmerLongitude)
    ) {
      return res.status(400).json({
        message: "Invalid farmer location",
      });
    }

    if (
      farmerLatitude < -90 ||
      farmerLatitude > 90 ||
      farmerLongitude < -180 ||
      farmerLongitude > 180
    ) {
      return res.status(400).json({
        message:
          "Invalid farmer location coordinates",
      });
    }

    // ===============================
    // CALCULATE DISTANCE
    // ===============================
    const distance = calculateDistance(
      farmerLatitude,
      farmerLongitude,
      buyerLatitude,
      buyerLongitude
    );

    // ===============================
    // TRANSPORTATION
    // ===============================
    const transportRatePerKm = 10;

    const transportationCost = Math.round(
      distance * transportRatePerKm
    );

    // ===============================
    // TRANSPORT SHARES
    // ===============================
    const buyerTransportShare =
      transportationCost / 2;

    const farmerTransportShare =
      transportationCost / 2;

    // ===============================
    // RESPONSE
    // ===============================
    return res.status(200).json({
      message:
        "Distance calculated successfully",

      distance: Number(
        distance.toFixed(2)
      ),

      transportRatePerKm,

      transportationCost,

      buyerTransportShare,

      farmerTransportShare,
    });

  } catch (error) {
    console.error(
      "Calculate Distance Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to calculate distance",
      error: error.message,
    });
  }
};


// =====================================================
// ACCEPT ORDER
// Only the assigned farmer can accept
// =====================================================
const acceptOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // ===============================
    // VALIDATE ORDER ID
    // ===============================
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    // ===============================
    // CHECK FARMER ROLE
    // ===============================
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can accept orders",
      });
    }

    // ===============================
    // FIND ORDER
    // ===============================
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // ===============================
    // CHECK FARMER AUTHORIZATION
    // ===============================
    if (order.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        message:
          "You are not allowed to accept this order",
      });
    }

    // ===============================
    // ORDER MUST BE PENDING
    // ===============================
    if (order.status !== "pending") {
      return res.status(400).json({
        message:
          "Only pending orders can be accepted",
      });
    }

    // ===============================
    // FIND PRODUCT
    // ===============================
    const product = await Product.findById(
      order.product
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // ===============================
    // CHECK AVAILABLE QUANTITY AGAIN
    // ===============================
    if (order.quantity > product.quantity) {
      return res.status(400).json({
        message: "Not enough quantity available",
        availableQuantity:
          product.quantity,
      });
    }

    // ===============================
    // REDUCE PRODUCT QUANTITY
    // ===============================
    product.quantity -= order.quantity;

    // ===============================
    // MARK SOLD IF EMPTY
    // ===============================
    if (product.quantity === 0) {
      product.status = "sold";
    }

    await product.save();

    // ===============================
    // UPDATE ORDER STATUS
    // ===============================
    order.status = "accepted";

    await order.save();

    return res.status(200).json({
      message:
        "Order accepted successfully",
      order,
      remainingQuantity:
        product.quantity,
    });

  } catch (error) {
    console.error(
      "Accept Order Error:",
      error
    );

    return res.status(500).json({
      message: "Order acceptance failed",
      error: error.message,
    });
  }
};


// =====================================================
// REJECT ORDER
// Only the assigned farmer can reject
// =====================================================
const rejectOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // ===============================
    // VALIDATE ORDER ID
    // ===============================
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    // ===============================
    // CHECK FARMER ROLE
    // ===============================
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message:
          "Only farmers can reject orders",
      });
    }

    // ===============================
    // FIND ORDER
    // ===============================
    const order = await Order.findById(
      orderId
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // ===============================
    // CHECK FARMER AUTHORIZATION
    // ===============================
    if (order.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        message:
          "You are not allowed to reject this order",
      });
    }

    // ===============================
    // ONLY PENDING ORDER CAN BE REJECTED
    // ===============================
    if (order.status !== "pending") {
      return res.status(400).json({
        message:
          "Only pending orders can be rejected",
      });
    }

    // ===============================
    // UPDATE STATUS
    // ===============================
    order.status = "rejected";

    await order.save();

    return res.status(200).json({
      message:
        "Order rejected successfully",
      order,
    });

  } catch (error) {
    console.error(
      "Reject Order Error:",
      error
    );

    return res.status(500).json({
      message:
        "Order rejection failed",
      error: error.message,
    });
  }
};


// =====================================================
// GET MY ORDERS
// Logged-in buyer can see their orders
// =====================================================
const getMyOrders = async (req, res) => {
  try {
    // ===============================
    // CHECK BUYER ROLE
    // ===============================
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message:
          "Only buyers can access buyer orders",
      });
    }

    const orders = await Order.find({
      buyer: req.user.id,
    })
      .populate("product")
      .populate(
        "farmer",
        "name email phone"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      message:
        "My orders fetched successfully",
      orders,
    });

  } catch (error) {
    console.error(
      "Get My Orders Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch my orders",
      error: error.message,
    });
  }
};


// =====================================================
// GET FARMER ORDERS
// Logged-in farmer can see their orders
// =====================================================
const getFarmerOrders = async (req, res) => {
  try {
    // ===============================
    // CHECK FARMER ROLE
    // ===============================
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message:
          "Only farmers can access farmer orders",
      });
    }

    const orders = await Order.find({
      farmer: req.user.id,
    })
      .populate(
        "buyer",
        "name email phone"
      )
      .populate("product")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      message:
        "Farmer orders fetched successfully",
      orders,
    });

  } catch (error) {
    console.error(
      "Get Farmer Orders Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch farmer orders",
      error: error.message,
    });
  }
};


// =====================================================
// EXPORTS
// =====================================================
module.exports = {
  placeOrder,
  calculateOrderDistance,
  acceptOrder,
  rejectOrder,
  getMyOrders,
  getFarmerOrders,
};