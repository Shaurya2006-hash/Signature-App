const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const docRoutes = require("./routes/documentRoutes");
const signatureRoutes = require("./routes/signatureRoutes");
const signatureRequestRoutes = require("./routes/signatureRequestRoutes");
const auditRoutes = require("./routes/auditRoutes");

dotenv.config();

connectDB();

const app = express();

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
  express.static(
    path.join(__dirname, "uploads")
  )
);

app.use(
  "/signed",
  express.static(
    path.join(__dirname, "signed")
  )
);

/*
=========================
API ROUTES
=========================
*/

app.use("/api/auth", authRoutes);
app.use("/api/docs", docRoutes);
app.use("/api/signatures", signatureRoutes);
app.use(
  "/api/signature-request",
  signatureRequestRoutes
);
app.use("/api/audit", auditRoutes);

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});