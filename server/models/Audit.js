const mongoose =
  require("mongoose");

const auditSchema =
  new mongoose.Schema(
    {
      fileId: {
        type:
          mongoose.Schema.Types.ObjectId,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      action: {
        type: String,
        required: true,
      },

      ipAddress: {
        type: String,
      },

      reason: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Audit",
    auditSchema
  );