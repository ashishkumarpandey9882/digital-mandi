const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const mspRoutes = require("./routes/mspRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/msp", mspRoutes);
app.use("/api/payments", paymentRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Digital Mandi API is running");
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});