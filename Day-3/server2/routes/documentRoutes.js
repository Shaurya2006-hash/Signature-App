const express = require("express");

const upload = require(
  "../middleware/uploadMiddleware"
);

const {
  uploadDocument,
} = require(
  "../controllers/documentController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.post(
  "/upload",
  protect,
  upload.single("pdf"),
  uploadDocument
);

module.exports = router;