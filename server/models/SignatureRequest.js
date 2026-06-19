const mongoose = require("mongoose");

const signatureRequestSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["pending", "signed", "rejected"],
      default: "pending",
    },

    signerName: {
      type: String,
      default: "",
    },

    signatureType: {
      type: String,
      default: "",
    },

    signatureImage: {
      type: String,
      default: "",
    },

    signedPdfUrl: {
      type: String,
      default: "",
    },

    reason: {
      type: String,
      default: "",
    },

    signedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SignatureRequest",
  signatureRequestSchema
);