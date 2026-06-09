const express = require(
  "express"
);

const {
  createSignature,
  getSignatures,
} = require(
  "../controllers/signatureController"
);

const router =
  express.Router();

router.post(
  "/",
  createSignature
);

router.get(
  "/",
  getSignatures
);

module.exports = router;