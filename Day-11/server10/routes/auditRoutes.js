const express =
  require("express");

const router =
  express.Router();

const {
  getAuditLogs,
} = require(
  "../controllers/auditController"
);

router.get(
  "/:fileId",
  getAuditLogs
);

module.exports =
  router;