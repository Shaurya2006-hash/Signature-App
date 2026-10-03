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

// ─────────────────────────────
// TEST ROUTE
// ─────────────────────────────
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Signature routes working",
  });
});

// ─────────────────────────────
// TEMPORARY TOKEN TEST ROUTE
// Use this to verify that the public
// signature-request routes are not
// being blocked by authentication.
// ─────────────────────────────
router.get("/token-test/:token", (req, res) => {
  console.log("TOKEN TEST ROUTE HIT:", req.params.token);

  res.json({
    success: true,
    message: "Token route is public and working",
    token: req.params.token,
  });
});

// ─────────────────────────────
// AUTHENTICATED ROUTES
// ─────────────────────────────
router.post(
  "/create",
  protect,
  createSignatureRequest
);

router.get(
  "/",
  protect,
  getSignatureRequests
);

router.put(
  "/self-sign/:id",
  protect,
  updateSelfSignStatus
);

// ─────────────────────────────
// PUBLIC EMAIL SIGNATURE ROUTES
// IMPORTANT: DO NOT ADD protect
// ─────────────────────────────
router.get(
  "/token/:token",
  getRequestByToken
);

router.put(
  "/sign/:token",
  signDocument
);

router.put(
  "/reject/:token",
  rejectDocument
);

module.exports = router;