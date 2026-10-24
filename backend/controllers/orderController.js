
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const MSP = require("../models/MSP");
const calculateDistance = require("../utils/distance");

// =====================================================
// PLACE ORDER
// Only buyers can place orders
// =====================================================
const placeOrder = async (req, res) => {
  try {
    const { productId, quantity, deliveryLocation } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can place orders",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (product.status !== "available" || product.quantity <= 0) {
      return res.status(400).json({
        message: "Product is not available",
      });
    }

    const orderQuantity = Number(quantity);

    if (
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
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

    if (!deliveryLocation) {
      return res.status(400).json({
        message: "Delivery location is required",
      });
    }

    const buyerLatitude = Number(deliveryLocation.latitude);
    const buyerLongitude = Number(deliveryLocation.longitude);

    if (
      !Number.isFinite(buyerLatitude) ||
      !Number.isFinite(buyerLongitude) ||
      deliveryLocation.latitude === "" ||
      deliveryLocation.longitude === ""
    ) {
      return res.status(400).json({
        message: "Invalid delivery location",
      });
    }

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

    if (
      !product.location ||
      product.location.latitude == null ||
      product.location.longitude == null
    ) {
      return res.status(400).json({
        message: "Farmer location is not available for this product",
      });
    }

    const farmerLatitude = Number(product.location.latitude);
    const farmerLongitude = Number(product.location.longitude);

    if (
      !Number.isFinite(farmerLatitude) ||
      !Number.isFinite(farmerLongitude) ||
      farmerLatitude < -90 ||
      farmerLatitude > 90 ||
      farmerLongitude < -180 ||
      farmerLongitude > 180
    ) {
      return res.status(400).json({
        message: "Invalid farmer location",
      });
    }

    // Find active MSP for the crop
    const cropName = product.cropName.trim();

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

    if (!msp) {
      return res.status(400).json({
        message: "Current MSP not found for this crop",
      });
    }

    const mspPrice = Number(msp.mspPrice);

    if (!Number.isFinite(mspPrice) || mspPrice <= 0) {
      return res.status(400).json({
        message: "Invalid MSP price",
      });
    }

    const distance = calculateDistance(
      farmerLatitude,
      farmerLongitude,
      buyerLatitude,
      buyerLongitude
    );

    if (!Number.isFinite(distance) || distance < 0) {
      return res.status(400).json({
        message: "Unable to calculate delivery distance",
      });
    }

    const transportRatePerKm = 10;

    const transportationCost = Math.round(
      distance * transportRatePerKm
    );

    const buyerTransportShare = transportationCost / 2;
    const farmerTransportShare = transportationCost / 2;

    const cropAmount = orderQuantity * mspPrice;
    const totalAmount = cropAmount + buyerTransportShare;

    // Create pending order.
    // Stock is deducted only when the farmer accepts it.
    const order = await Order.create({
      buyer: req.user.id,
      farmer: product.farmer,
      product: product._id,
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

    return res.status(201).json({
      message: "Order placed successfully",
      order,
      currentMsp: {
        price: msp.mspPrice,
        unit: msp.unit,
        season: msp.season,
        year: msp.year,
      },
      distance: `${distance.toFixed(2)} km`,
      transportationCost,
      buyerTransportShare,
      farmerTransportShare,
    });
  } catch (error) {
    console.error("Place Order Error:", error);

    return res.status(500).json({
      message: "Order creation failed",
      error: error.message,
    });
  }
};

// =====================================================
// CALCULATE ORDER DISTANCE
// =====================================================
const calculateOrderDistance = async (req, res) => {
  try {
    const { productId, deliveryLocation } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can calculate order distance",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (!deliveryLocation) {
      return res.status(400).json({
        message: "Delivery location is required",
      });
    }

    const buyerLatitude = Number(deliveryLocation.latitude);
    const buyerLongitude = Number(deliveryLocation.longitude);

    if (
      !Number.isFinite(buyerLatitude) ||
      !Number.isFinite(buyerLongitude) ||
      deliveryLocation.latitude === "" ||
      deliveryLocation.longitude === ""
    ) {
      return res.status(400).json({
        message: "Invalid delivery location",
      });
    }

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

    if (
      !product.location ||
      product.location.latitude == null ||
      product.location.longitude == null
    ) {
      return res.status(400).json({
        message: "Farmer location is not available for this product",
      });
    }

    const farmerLatitude = Number(product.location.latitude);
    const farmerLongitude = Number(product.location.longitude);

    if (
      !Number.isFinite(farmerLatitude) ||
      !Number.isFinite(farmerLongitude) ||
      farmerLatitude < -90 ||
      farmerLatitude > 90 ||
      farmerLongitude < -180 ||
      farmerLongitude > 180
    ) {
      return res.status(400).json({
        message: "Invalid farmer location",
      });
    }

    const distance = calculateDistance(
      farmerLatitude,
      farmerLongitude,
      buyerLatitude,
      buyerLongitude
    );

    if (!Number.isFinite(distance) || distance < 0) {
      return res.status(400).json({
        message: "Unable to calculate delivery distance",
      });
    }

    const transportRatePerKm = 10;

    const transportationCost = Math.round(
      distance * transportRatePerKm
    );

    const buyerTransportShare = transportationCost / 2;
    const farmerTransportShare = transportationCost / 2;

    return res.status(200).json({
      message: "Distance calculated successfully",
      distance: Number(distance.toFixed(2)),
      transportRatePerKm,
      transportationCost,
      buyerTransportShare,
      farmerTransportShare,
    });
  } catch (error) {
    console.error("Calculate Distance Error:", error);

    return res.status(500).json({
      message: "Failed to calculate distance",
      error: error.message,
    });
  }
};

// =====================================================
// ACCEPT ORDER
// Only the assigned farmer can accept.
// Order status and stock update are transactional.
// =====================================================
const acceptOrder = async (req, res) => {
  let session;

  try {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can accept orders",
      });
    }

    session = await mongoose.startSession();

    let acceptedOrder;
    let remainingQuantity;

    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      if (order.farmer.toString() !== req.user.id) {
        const error = new Error(
          "You are not allowed to accept this order"
        );
        error.statusCode = 403;
        throw error;
      }

      if (order.status !== "pending") {
        const error = new Error(
          "Only pending orders can be accepted"
        );
        error.statusCode = 400;
        throw error;
      }

      // Reserve this pending order using a conditional update.
      const claimedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          farmer: req.user.id,
          status: "pending",
        },
        {
          $set: {
            status: "accepted",
          },
        },
        {
          session,
          returnDocument: "after",
          runValidators: true,
        }
      );

      if (!claimedOrder) {
        const error = new Error(
          "Order was already processed. Please refresh."
        );
        error.statusCode = 409;
        throw error;
      }

      // Atomic stock deduction using $inc.
      const product = await Product.findOneAndUpdate(
        {
          _id: order.product,
          farmer: req.user.id,
          status: "available",
          quantity: {
            $gte: order.quantity,
          },
        },
        {
          $inc: {
            quantity: -order.quantity,
          },
        },
        {
          session,
          returnDocument: "after",
          runValidators: true,
        }
      );

      if (!product) {
        const error = new Error(
          "Insufficient stock or product is no longer available"
        );
        error.statusCode = 400;
        throw error;
      }

      // Mark product sold if no stock remains.
      if (product.quantity === 0) {
        product.status = "sold";
        await product.save({ session });
      }

      acceptedOrder = claimedOrder;
      remainingQuantity = product.quantity;
    });

    return res.status(200).json({
      message: "Order accepted successfully",
      order: acceptedOrder,
      remainingQuantity,
    });
  } catch (error) {
    console.error("Accept Order Error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "Order acceptance failed",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// =====================================================
// REJECT ORDER
// Only the assigned farmer can reject.
// =====================================================
const rejectOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can reject orders",
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        farmer: req.user.id,
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!order) {
      const existingOrder = await Order.findById(orderId);

      if (!existingOrder) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      if (existingOrder.farmer.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You are not allowed to reject this order",
        });
      }

      return res.status(400).json({
        message: "Only pending orders can be rejected",
      });
    }

    return res.status(200).json({
      message: "Order rejected successfully",
      order,
    });
  } catch (error) {
    console.error("Reject Order Error:", error);

    return res.status(500).json({
      message: "Order rejection failed",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY ORDERS
// =====================================================
const getMyOrders = async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can access buyer orders",
      });
    }

    const orders = await Order.find({
      buyer: req.user.id,
    })
      .populate("product")
      .populate("farmer", "name email phone")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      message: "My orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      message: "Failed to fetch my orders",
      error: error.message,
    });
  }
};

// =====================================================
// GET FARMER ORDERS
// =====================================================
const getFarmerOrders = async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can access farmer orders",
      });
    }

    const orders = await Order.find({
      farmer: req.user.id,
    })
      .populate("buyer", "name email phone")
      .populate("product")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      message: "Farmer orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Get Farmer Orders Error:", error);

    return res.status(500).json({
      message: "Failed to fetch farmer orders",
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
