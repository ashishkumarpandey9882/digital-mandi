
const razorpay = require("../services/razorpayService");
const crypto = require("crypto");
const Order = require("../models/Order");

// Get payment details for an order
const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("product", "cropName")
      .populate("buyer", "name email")
      .populate("farmer", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only buyer or farmer related to this order can access it
    const userId = req.user.id;

    if (
      order.buyer._id.toString() !== userId &&
      order.farmer._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this payment",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment details fetched successfully",
      payment: {
        orderId: order._id,
        cropName: order.product?.cropName,
        amount: order.totalAmount,
        status: order.payment?.status || "pending",
        gateway: order.payment?.gateway || null,
        paymentId: order.payment?.paymentId || null,
        gatewayOrderId: order.payment?.gatewayOrderId || null,
        paidAt: order.payment?.paidAt || null,
        refundedAt: order.payment?.refundedAt || null,
      },
    });
  } catch (error) {
    console.error("Get payment details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
    });
  }
};

// Create a Razorpay payment order
const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the existing Digital Mandi order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only the buyer who owns this order can initiate payment
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the buyer can initiate payment",
      });
    }

    // Payment can be initiated only after the farmer accepts the order
    if (order.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Payment is available only after the farmer accepts the order",
      });
    }

    // Prevent payment if the order is already paid
    if (order.payment?.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid",
      });
    }

    // Convert rupees into paise
    const amountInPaise = Math.round(order.totalAmount * 100);

    if (
      !Number.isSafeInteger(amountInPaise) ||
      amountInPaise <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    // Create an order on Razorpay
    const gatewayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order._id.toString(),
      notes: {
        digitalMandiOrderId: order._id.toString(),
      },
    });

    // Store Razorpay order details in MongoDB
    order.payment.status = "pending";
    order.payment.gateway = "razorpay";
    order.payment.gatewayOrderId = gatewayOrder.id;

    await order.save();

    // Send the details needed by the frontend
    return res.status(201).json({
      success: true,
      message: "Razorpay payment order created successfully",
      payment: {
        orderId: order._id,
        gatewayOrderId: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};


// Verify a Razorpay checkout payment before marking the order as paid
const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the buyer who owns this order can verify payment",
      });
    }

    if (order.payment?.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "This order has already been paid",
        payment: {
          orderId: order._id,
          status: order.payment.status,
        },
      });
    }

    if (
      order.payment?.gatewayOrderId !== razorpay_order_id ||
      order.payment?.gateway !== "razorpay"
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order does not match this Digital Mandi order",
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is missing");
      return res.status(500).json({
        success: false,
        message: "Payment verification is not configured",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpay_signature, "utf8");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature",
      });
    }

    // Confirm the payment against Razorpay's server-side payment record
    const gatewayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    const expectedAmount = Math.round(order.totalAmount * 100);

    if (
      gatewayPayment.order_id !== razorpay_order_id ||
      gatewayPayment.amount !== expectedAmount ||
      gatewayPayment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match the order amount",
      });
    }

    if (gatewayPayment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured yet. Please check Razorpay capture settings or try again later.",
      });
    }

    order.payment.status = "paid";
    order.payment.gateway = "razorpay";
    order.payment.paymentId = razorpay_payment_id;
    order.payment.gatewayOrderId = razorpay_order_id;
    order.payment.paidAt = new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        orderId: order._id,
        paymentId: razorpay_payment_id,
        status: order.payment.status,
        paidAt: order.payment.paidAt,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

module.exports = {
  getPaymentDetails,
  createPaymentOrder,
  verifyPayment,
};
