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

      signer: {
        type: String,
        required: true,
      },

      action: {
        type: String,
        required: true,
      },

      ip: {
        type: String,
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