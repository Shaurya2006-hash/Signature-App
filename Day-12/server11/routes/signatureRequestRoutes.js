const express =
  require("express");

const router =
  express.Router();

const {
  createRequest,
  verifyToken,
  markSigned,
  rejectRequest,
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
module.exports = router;