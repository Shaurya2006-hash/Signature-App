const Audit =
  require("../models/Audit");

const createAuditLog =
  async (
    fileId,
    email,
    action,
    ipAddress,
    reason = ""
  ) => {

    await Audit.create({
      fileId,
      email,
      action,
      ipAddress,
      reason,
    });

  };

module.exports =
  createAuditLog;