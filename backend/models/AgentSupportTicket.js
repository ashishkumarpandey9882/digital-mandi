
const mongoose = require("mongoose");

const agentSupportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "order",
        "payment",
        "product",
        "account",
        "msp",
        "scheme",
        "other",
      ],
      default: "other",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "AgentSupportTicket",
  agentSupportTicketSchema
);
