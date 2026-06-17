const Audit =
  require("../models/Audit");

const createAuditLog =
  async (
    fileId,
    signer,
    action,
    ip
  ) => {
    await Audit.create({
      fileId,
      signer,
      action,
      ip,
    });
  };

module.exports =
  createAuditLog;