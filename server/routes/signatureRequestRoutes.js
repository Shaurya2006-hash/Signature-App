const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createSignatureRequest,
  getSignatureRequests,
  updateSelfSignStatus,
} = require("../controllers/signatureRequestController");

router.post("/create", protect, createSignatureRequest);
router.get("/", protect, getSignatureRequests);
router.put("/self-sign/:id", protect, updateSelfSignStatus);

module.exports = router;