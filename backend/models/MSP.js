const mongoose = require("mongoose");

const mspSchema = new mongoose.Schema(
    {
        cropName: {
            type: String,
            required: true,
            trim: true
        },

        mspPrice: {
            type: Number,
            required: true,
            min: 0
        },

        unit: {
            type: String,
            default: "quintal",
            trim: true
        },

        season: {
            type: String,
            required: true,
            trim: true
        },

        year: {
            type: Number,
            required: true
        },

        effectiveFrom: {
            type: Date,
            required: true
        },

        effectiveTo: {
            type: Date,
            default: null
        },

        governmentSource: {
            type: String,
            required: true,
            trim: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const MSP = mongoose.model("MSP", mspSchema);

module.exports = MSP;