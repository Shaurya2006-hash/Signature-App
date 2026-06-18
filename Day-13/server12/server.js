const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const pdfRoutes =
  require("./routes/pdfRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const documentRoutes = require("./routes/documentRoutes");
const signatureRoutes = require("./routes/signatureRoutes");
const emailRoutes =
  require("./routes/emailRoutes");
const signatureRequestRoutes =
  require(
    "./routes/signatureRequestRoutes"
  );
  const auditRoutes =
  require(
    "./routes/auditRoutes"
  );

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
app.use(
  "/api/pdf",
  pdfRoutes
);
app.use(
  "/signed",
  express.static(
    path.join(__dirname, "signed")
  )
);
app.use(
  "/api/email",
  emailRoutes
);
app.use(
  "/api/signature-request",
  signatureRequestRoutes
);
app.use(
  "/api/audit",
  auditRoutes
);

// Start Server
const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});