const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

// ─────────────────────────────
// ROUTES
// ─────────────────────────────
const authRoutes = require("./routes/authRoutes");
const docRoutes = require("./routes/documentRoutes");
const signatureRoutes = require("./routes/signatureRoutes");
const signatureRequestRoutes = require("./routes/signatureRequestRoutes");
const auditRoutes = require("./routes/auditRoutes");
const pdfRoutes = require("./routes/pdfRoutes");

// ─────────────────────────────
// DB CONNECT
// ─────────────────────────────
connectDB();

const app = express();

/*
=========================
MIDDLEWARE (IMPORTANT ORDER)
=========================
*/

// ✅ JSON BODY PARSER (MUST BE FIRST)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS CONFIG (FIXED FOR FRONTEND + RENDER)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://signature-app-yv04.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/*
=========================
STATIC FILES
=========================
*/

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use(
  "/signed",
  express.static(path.join(__dirname, "signed"))
);

/*
=========================
API ROUTES
=========================
*/

app.use("/api/pdf", pdfRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/documents", docRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/signature-request", signatureRequestRoutes);
app.use("/api/audit", auditRoutes);

/*
=========================
TEST ROUTE
=========================
*/

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Test route works",
  });
});

/*
=========================
ROOT ROUTE
=========================
*/

app.get("/", (req, res) => {
  res.send("API Running");
});

/*
=========================
SERVER START
=========================
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});