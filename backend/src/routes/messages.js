const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

require("../models/Message");
const Message = mongoose.model("Message");

const router = express.Router();

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_change_me",
    );

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }
}

router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res
        .status(400)
        .json({ message: "receiverId and text are required." });
    }

    const message = await Message.create({
      senderId: req.user.id,
      receiverId,
      senderRole: req.user.role,
      text,
    });

    return res.status(201).json({
      message: "Message sent successfully.",
      data: message,
    });
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      receiverId: req.user.id,
    })
      .populate("senderId", "firstName lastName email role")
      .sort({ createdAt: -1 });

    return res.json(messages);
  } catch (err) {
    console.error("GET MY MESSAGES ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      receiverId: req.user.id,
    })
      .populate("senderId", "firstName lastName email role")
      .sort({ createdAt: -1 });

    return res.json(messages);
  } catch (err) {
    console.error("GET MY MESSAGES ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});
module.exports = router;
