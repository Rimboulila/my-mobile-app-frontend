const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["patient", "receptionist"],
      default: "patient",
    },
    firstName: String,
    lastName: String,
    birthday: String,
    phone: String,
    address: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
