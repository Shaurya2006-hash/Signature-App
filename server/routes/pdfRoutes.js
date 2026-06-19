const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// ✅ FIX: correct function name
const { generateSignedPdf } = require("../controllers/pdfController");

router.post("/generate", protect, generateSignedPdf);

module.exports = router;