const Audit =
  require("../models/Audit");

const getAuditLogs =
  async (req, res) => {
    try {
      const { fileId } =
        req.params;

      const logs =
        await Audit.find({
          fileId,
        });

      res.json(logs);
    } catch (error) {
      res.status(500).json({
        message:
          error.message,
      });
    }
  };

module.exports = {
  getAuditLogs,
};