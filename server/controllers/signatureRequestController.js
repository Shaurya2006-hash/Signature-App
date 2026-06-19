const Signature = require("../models/Signature");

// ===============================
// SAVE SIGNATURE (MULTI-SIGNATURE SAFE)
// ===============================
const saveSignature = async (req, res) => {
  try {
    const {
      fileId,
      signer,
      signerName,
      fontStyle,
      signatureImage,
      x,
      y,
      status,
    } = req.body;

    if (!fileId) {
      return res.status(400).json({ message: "fileId is required" });
    }

    // Validate at least one signature type
    if (!signerName && !signatureImage) {
      return res.status(400).json({
        message: "Either typed or drawn signature is required",
      });
    }

    const signature = await Signature.create({
      fileId,
      signer,
      signerName: signerName || null,
      fontStyle: fontStyle || "italic",
      signatureImage: signatureImage || null,
      x: Number(x || 100),
      y: Number(y || 100),
      status: status || "pending",
    });

    return res.status(201).json(signature);
  } catch (error) {
    console.error("saveSignature error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// GET SIGNATURES (OPTIONAL FILTER)
// ===============================
const getSignatures = async (req, res) => {
  try {
    const { fileId } = req.query;

    const query = fileId ? { fileId } : {};

    const signatures = await Signature.find(query).sort({
      createdAt: -1,
    });

    return res.json(signatures);
  } catch (error) {
    console.error("getSignatures error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  saveSignature,
  getSignatures,
};