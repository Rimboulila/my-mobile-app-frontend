const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

require("../models/Appointment");
const Appointment = mongoose.model("Appointment");

const doctorHospitalMap = {
  "Dr Smith": "Kingston Hospital",
  "Dr Patel": "St George's Hospital",
  "Dr Khan": "Chelsea and Westminster",
};

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

// create appointment
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { date, time, type, doctor } = req.body;

    const doctorHospitalMap = {
      "Dr Smith": "Kingston Hospital",
      "Dr Patel": "St George's Hospital",
      "Dr Khan": "Chelsea and Westminster",
    };

    const hospital = doctorHospitalMap[doctor];

    if (!date || !time || !type || !doctor || !hospital) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const [newHour, newMinute] = time.split(":").map(Number);
    const newTotalMinutes = newHour * 60 + newMinute;

    const existingAppointments = await Appointment.find({
      date,
      doctor,
      status: { $ne: "cancelled" },
    });

    const hasConflict = existingAppointments.some((appt) => {
      const [apptHour, apptMinute] = appt.time.split(":").map(Number);
      const apptTotalMinutes = apptHour * 60 + apptMinute;

      return Math.abs(apptTotalMinutes - newTotalMinutes) < 15;
    });

    if (hasConflict) {
      return res.status(409).json({
        message:
          "This doctor already has an appointment within 15 minutes of that time.",
      });
    }
    const appointment = await Appointment.create({
      date,
      time,
      type,
      doctor,
      hospital,
      status: "available",
    });

    return res.status(201).json({
      message: "Appointment created successfeully.",
      appointment,
    });
  } catch (err) {
    console.error("CREATE APPOINTMENT ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// get available appointments
router.get("/available", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "available" }).sort({
      date: 1,
      time: 1,
    });

    return res.json(appointments);
  } catch (err) {
    console.error("AVAILABLE APPOINTMENTS ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// book appointment
router.post("/book/:id", authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason is required." });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      status: "available",
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not available." });
    }

    appointment.status = "booked";
    appointment.bookedBy = req.user.id;
    appointment.reason = reason.trim();

    await appointment.save();

    return res.json({
      message: "Appointment booked successfully.",
      appointment,
    });
  } catch (err) {
    console.error("BOOK APPOINTMENT ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// get my booked appointments
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      bookedBy: req.user.id,
      status: "booked",
    }).sort({ date: 1, time: 1 });

    return res.json(appointments);
  } catch (err) {
    console.error("MY APPOINTMENTS ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});
// cancel my booked appointment
router.post("/cancel/:id", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      bookedBy: req.user.id,
      status: "booked",
    });

    if (!appointment) {
      return res.status(404).json({ message: "Booked appointment not found." });
    }

    appointment.status = "available";
    appointment.bookedBy = null;
    appointment.reason = "";

    await appointment.save();

    return res.json({
      message: "Appointment cancelled successfully.",
      appointment,
    });
  } catch (err) {
    console.error("CANCEL APPOINTMENT ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});
// reschedule my appointment
router.post("/reschedule/:newId", authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason is required." });
    }

    const currentAppointment = await Appointment.findOne({
      bookedBy: req.user.id,
      status: "booked",
    });

    if (!currentAppointment) {
      return res
        .status(404)
        .json({ message: "No current booked appointment found." });
    }

    const newAppointment = await Appointment.findOne({
      _id: req.params.newId,
      status: "available",
    });

    if (!newAppointment) {
      return res
        .status(404)
        .json({ message: "New appointment is not available." });
    }

    currentAppointment.status = "available";
    currentAppointment.bookedBy = null;
    currentAppointment.reason = "";
    await currentAppointment.save();

    newAppointment.status = "booked";
    newAppointment.bookedBy = req.user.id;
    newAppointment.reason = reason.trim();
    await newAppointment.save();

    return res.json({
      message: "Appointment rescheduled successfully.",
      oldAppointment: currentAppointment,
      newAppointment,
    });
  } catch (err) {
    console.error("RESCHEDULE APPOINTMENT ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});
// GET APPOINTMENT+person
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await Appointment.deleteMany({
      status: { $in: ["completed", "missed"] },
      resolvedAt: { $lte: sevenDaysAgo },
    });

    const appointments = await Appointment.find()
      .populate("bookedBy", "firstName lastName email")
      .sort({
        date: 1,
        time: 1,
      });

    return res.json(appointments);
  } catch (err) {
    console.error("ALL APPOINTMENTS ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});
///DELETE
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // If appointment is booked, turn it back into a clean available slot
    if (appointment.status === "booked") {
      appointment.status = "available";
      appointment.bookedBy = null;
      appointment.reason = "";
      await appointment.save();

      return res.json({
        message: "Booked appointment removed successfully.",
        appointment,
      });
    }

    // If appointment is already available, delete it completely
    if (appointment.status === "available") {
      await Appointment.deleteOne({ _id: req.params.id });

      return res.json({
        message: "Available appointment deleted successfully.",
      });
    }

    // Completed / missed can also be deleted if you want
    if (["completed", "missed"].includes(appointment.status)) {
      await Appointment.deleteOne({ _id: req.params.id });

      return res.json({ message: "Appointment deleted successfully." });
    }

    return res.status(400).json({
      message: "This appointment cannot be removed.",
    });
  } catch (err) {
    console.error("DELETE APPOINTMENT ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});
///mark appointmenmt complteede
router.patch("/complete/:id", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      status: "booked",
    });

    if (!appointment) {
      return res.status(404).json({ message: "Booked appointment not found." });
    }

    appointment.status = "completed";
    await appointment.save();

    return res.json({
      message: "Appointment marked as completed.",
      appointment,
    });
  } catch (err) {
    console.error("COMPLETE APPOINTMENT ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});
// mark completed
router.patch("/complete/:id", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      status: "booked",
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    appointment.status = "completed";
    appointment.resolvedAt = new Date();
    await appointment.save();

    return res.json({
      message: "Appointment marked as completed.",
      appointment,
    });
  } catch (err) {
    console.error("COMPLETE APPOINTMENT ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// mark missed
router.patch("/missed/:id", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      status: "booked",
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    appointment.status = "missed";
    appointment.resolvedAt = new Date();
    await appointment.save();

    return res.json({
      message: "Appointment marked as missed.",
      appointment,
    });
  } catch (err) {
    console.error("MISSED APPOINTMENT ERROR:", err);
    return res.status(500).json({ message: "Server error." });
  }
});
module.exports = router;
