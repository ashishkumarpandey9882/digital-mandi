const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // MSP price at the time order was placed
    mspPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    cropAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    transportationCost: {
      type: Number,
      required: true,
      min: 0,
    },

    buyerTransportShare: {
      type: Number,
      required: true,
      min: 0,
    },

    farmerTransportShare: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ================= DELIVERY LOCATION =================

    deliveryLocation: {
      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },
    },

    distance: {
      type: Number,
      required: true,
      min: 0,
    },

    // ================= ORDER STATUS =================

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "in-transit",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    // ================= PAYMENT =================

    payment: {
      status: {
        type: String,
        enum: [
          "pending",
          "paid",
          "failed",
          "refunded",
        ],
        default: "pending",
      },

      gateway: {
        type: String,
        default: null,
      },

      paymentId: {
        type: String,
        default: null,
      },

      gatewayOrderId: {
        type: String,
        default: null,
      },

      paidAt: {
        type: Date,
        default: null,
      },

      refundedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Order",
  orderSchema
);