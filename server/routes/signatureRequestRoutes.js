const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createSignatureRequest,
  getSignatureRequests,
  updateSelfSignStatus,
  getRequestByToken,
  signDocument,
  rejectDocument,
} = require("../controllers/signatureRequestController");

// =================================
// AUTHENTICATED ROUTES
// =================================

router.post("/create", protect, createSignatureRequest);

router.get("/", protect, getSignatureRequests);

router.put("/self-sign/:id", protect, updateSelfSignStatus);

// =================================
// PUBLIC EMAIL ROUTES
// =================================

// Open email link
router.get("/:token", getRequestByToken);

// Sign document
router.put("/sign/:token", signDocument);

// Reject document
router.put("/reject/:token", rejectDocument);

module.exports = router;