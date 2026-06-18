const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const docRoutes = require("./routes/documentRoutes");
const signatureRoutes = require("./routes/signatureRoutes");
const signatureRequestRoutes = require("./routes/signatureRequestRoutes");
const auditRoutes = require("./routes/auditRoutes");
const pdfRoutes = require("./routes/pdfRoutes");

connectDB();

const app = express();

/*
=========================
MIDDLEWARE
=========================
*/

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

/*
=========================
STATIC FOLDERS
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

// ✅ Changed from /api/docs to /api/documents
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
SERVER
=========================
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});