const express = require("express");

const router = express.Router();

const { generateSignedPdf } = require("../controllers/pdfController");

// IMPORTANT: must match frontend POST
router.post("/generate/:documentId", generateSignedPdf);

module.exports = router;