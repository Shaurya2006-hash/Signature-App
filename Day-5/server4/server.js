const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const documentRoutes = require("./routes/documentRoutes");
const signatureRoutes = require("./routes/signatureRoutes");

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded PDF files
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// Test Route
app.get("/", (req, res) => {
  res.send("API Running");
});

// API Routes
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/docs", documentRoutes);

app.use(
  "/api/signatures",
  signatureRoutes
);

// Start Server
const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});