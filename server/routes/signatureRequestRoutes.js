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

// Dashboard routes
router.post("/create", protect, createSignatureRequest);

router.get("/", protect, getSignatureRequests);

router.put("/self-sign/:id", protect, updateSelfSignStatus);

// Public routes from email
router.get("/token/:token", getRequestByToken);

router.post("/sign/:token", signDocument);

router.post("/reject/:token", rejectDocument);

module.exports = router;