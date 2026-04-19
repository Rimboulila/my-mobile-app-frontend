const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log("BACKEND IS RUNNING");

app.get("/api/test", (req, res) => {
  res.json({ ok: true });
});

/* ROUTES */

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const appointmentRoutes = require("./routes/appointments");
app.use("/api/appointments", appointmentRoutes);

const messageRoutes = require("./routes/messages");
app.use("/api/messages", messageRoutes);

/* DATABASE */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log("Server running on port " + PORT);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
