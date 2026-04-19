const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    type: { type: String, required: true },

    doctor: { type: String, required: true },
    hospital: { type: String, required: true },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["available", "booked", "cancelled", "completed", "missed"],
      default: "available",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
