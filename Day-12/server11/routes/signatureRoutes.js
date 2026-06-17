const express = require("express");

const router = express.Router();

const {
  saveSignature,
  getSignatures,
} = require("../controllers/signatureController");

router.post("/", saveSignature);

router.get("/", getSignatures);

module.exports = router;