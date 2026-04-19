console.log("Auth.js is loading please work thank you");

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

require("../models/User");

const User = mongoose.model("User");

console.log(" typeof User:", typeof User);
console.log(" typeof User.findOne:", typeof User.findOne);

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      birthday,
      phone,
      address,
    } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const emailLower = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: emailLower,
      password: hashed,
      role: role || "patient",
      birthday,
      phone,
      address,
    });

    return res.status(201).json({
      message: "User registered.",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        birthday: user.birthday,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const emailLower = String(email).toLowerCase().trim();

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "dev_secret_change_me",
      { expiresIn: "7d" },
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        birthday: user.birthday,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// FOR Main receptionist page
router.get("/patients", async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" }).select(
      "firstName lastName email birthday phone address",
    );

    return res.json(patients);
  } catch (err) {
    console.error("GET PATIENTS ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// FOR PATIENT BY ID
router.get("/patients/:id", async (req, res) => {
  try {
    const patient = await User.findOne({
      _id: req.params.id,
      role: "patient",
    }).select("firstName lastName email birthday phone address");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    return res.json(patient);
  } catch (err) {
    console.error("GET PATIENT BY ID ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// RECEPTIONIST LOGIN
router.post("/admin-login", async (req, res) => {
  try {
    const { adminPassword } = req.body;

    const correctAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPassword !== correctAdminPassword) {
      return res.status(401).json({ message: "Invalid admin password." });
    }

    let receptionist = await User.findOne({
      email: "receptionist@local",
      role: "receptionist",
    });

    if (!receptionist) {
      receptionist = await User.create({
        firstName: "Reception",
        lastName: "Admin",
        email: "receptionist@local",
        password: "temp_admin_password_not_used",
        role: "receptionist",
      });
    }

    const token = jwt.sign(
      {
        id: receptionist._id,
        role: receptionist.role,
      },
      process.env.JWT_SECRET || "dev_secret_change_me",
      { expiresIn: "7d" },
    );

    return res.json({
      message: "Admin login successful.",
      token,
      user: {
        id: receptionist._id,
        email: receptionist.email,
        role: receptionist.role,
        firstName: receptionist.firstName,
        lastName: receptionist.lastName,
      },
    });
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
