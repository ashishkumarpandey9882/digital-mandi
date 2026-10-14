const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cropName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    // Farmer's location
    location: {
      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);