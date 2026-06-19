const Signature = require("../models/Signature");

// ===============================
// SAVE SIGNATURE (NO OVERWRITE)
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

    // Create NEW signature every time (IMPORTANT FIX)
    const signature = await Signature.create({
      fileId,
      signer,
      signerName,
      fontStyle,
      signatureImage,
      x,
      y,
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
// GET ALL SIGNATURES
// ===============================
const getSignatures = async (req, res) => {
  try {
    const { fileId } = req.query;

    const query = fileId ? { fileId } : {};

    const signatures = await Signature.find(query)
      .sort({ createdAt: -1 });

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