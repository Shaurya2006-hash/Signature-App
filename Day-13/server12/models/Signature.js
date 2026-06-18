const mongoose = require("mongoose");

const signatureSchema =
  new mongoose.Schema(
    {
      fileId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
      },

      signer: {
        type: String,
        required: true,
      },

      signerName: {
        type: String,
      },

      fontStyle: {
        type: String,
        default: "italic",
      },

      signatureImage: {
        type: String,
      },

      x: {
        type: Number,
        required: true,
      },

      y: {
        type: Number,
        required: true,
      },

      status: {
        type: String,
        default: "pending",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Signature",
    signatureSchema
  );