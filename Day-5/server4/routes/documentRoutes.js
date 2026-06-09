const express = require("express");

const upload = require(
  "../middleware/uploadMiddleware"
);

const {
  uploadDocument,
  getDocuments,
} = require(
  "../controllers/documentController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

// Upload PDF
router.post(
  "/upload",
  protect,
  upload.single("pdf"),
  uploadDocument
);

// Get all uploaded documents
router.get(
  "/",
  protect,
  getDocuments
);

module.exports = router;