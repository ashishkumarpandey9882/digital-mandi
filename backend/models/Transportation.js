const mongoose = require("mongoose");

const transportationSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

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

    pickupLocation: {
      type: String,
      required: true,
    },

    deliveryLocation: {
      type: String,
      required: true,
    },

    distance: {
      type: Number,
      required: true,
    },

    transportationCost: {
      type: Number,
      required: true,
    },

    buyerShare: {
      type: Number,
      required: true,
    },

    farmerShare: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "picked_up",
        "in_transit",
        "delivered",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Transportation",
  transportationSchema
);