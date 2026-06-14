const express =
  require("express");

const router =
  express.Router();

const {
  createRequest,
  verifyToken,
  markSigned,
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

module.exports = router;