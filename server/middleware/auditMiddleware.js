const AuditLog = require("../models/AuditLog"); // adjust if your model name differs

const createAuditLog = async (documentId, email, action, ip, reason = "") => {
  try {
    await AuditLog.create({
      documentId,
      email,
      action,
      ip,
      reason,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

module.exports = createAuditLog;