const express =
  require("express");

const router =
  express.Router();

const {
  sendSignatureRequest,
} = require(
  "../controllers/emailController"
);

router.post(
  "/send",
  sendSignatureRequest
);

module.exports = router;