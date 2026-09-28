const express = require("express");

const router = express.Router();

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  generatePdf,
} = require("../controllers/pdfController");

// Generate signed PDF
router.post(
  "/generate",
  protect,
  generatePdf
);

module.exports = router;