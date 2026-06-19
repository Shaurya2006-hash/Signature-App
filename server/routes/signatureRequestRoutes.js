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

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Signature routes working",
  });
});

// AUTH ROUTES
router.post("/create", protect, createSignatureRequest);

router.get("/", protect, getSignatureRequests);

router.put("/self-sign/:id", protect, updateSelfSignStatus);

// PUBLIC EMAIL ROUTES
router.get("/token/:token", getRequestByToken);

router.put("/sign/:token", signDocument);

router.put("/reject/:token", rejectDocument);

module.exports = router;