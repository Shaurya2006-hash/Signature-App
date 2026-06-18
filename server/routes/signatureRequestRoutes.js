const express = require("express");
const router = express.Router();

const {
  createRequest,
  verifyToken,
  markSigned,
  rejectRequest,
  getAllRequests,
  selfSignDocument,
} = require("../controllers/signatureRequestController");

// ⚠️ ORDER MATTERS — specific routes MUST come before /:token
// Otherwise Express matches /sign/:token as token="sign" and crashes

router.post("/create", createRequest);
router.get("/", getAllRequests);

// These must be before /:token
router.put("/sign/:token", markSigned);
router.put("/reject/:token", rejectRequest);
router.put("/self-sign/:documentId", selfSignDocument);

// This must be LAST — it's a catch-all wildcard
router.get("/:token", verifyToken);

module.exports = router;