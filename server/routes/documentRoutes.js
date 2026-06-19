const express = require("express");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadDocument,
  getDocuments,
  checkDocumentsExist,
} = require("../controllers/documentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Upload PDF
router.post(
  "/upload",
  protect,
  upload.single("pdf"),
  uploadDocument
);

router.get("/", protect, getDocuments);

router.get("/exists", protect, checkDocumentsExist);
module.exports = router;