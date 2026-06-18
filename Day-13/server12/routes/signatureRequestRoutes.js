const express =
  require("express");

const router =
  express.Router();

const {
  createRequest,
  verifyToken,
  markSigned,
  rejectRequest,
  getAllRequests,
  selfSignDocument,
} = require(
  "../controllers/signatureRequestController"
);

router.post(
  "/create",
  createRequest
);
router.get(
  "/:token",
  verifyToken
);

router.put(
  "/sign/:token",
  markSigned
);
router.put(
  "/reject/:token",
  rejectRequest
);
router.get(
"/",
getAllRequests
);
router.put(
  "/self-sign/:documentId",
  selfSignDocument
);
module.exports = router;