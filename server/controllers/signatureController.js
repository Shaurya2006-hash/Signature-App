const Signature = require("../models/Signature");

// ===============================
// SAVE SIGNATURE
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
      return res.status(400).json({
        message: "fileId is required",
      });
    }

    if (!signerName && !signatureImage) {
      return res.status(400).json({
        message: "Either typed or drawn signature is required",
      });
    }

    const signature = await Signature.create({
      fileId,
      signer: signer || "Unknown",

      // Typed signature
      signerName: signerName || null,
      fontStyle: fontStyle || "italic",

      // Drawn signature
      signatureImage: signatureImage || null,

      // Position
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
// GET ALL SIGNATURES
// ===============================
const getSignatures = async (req, res) => {
  try {
    const signatures = await Signature.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(signatures);
  } catch (error) {
    console.error("getSignatures error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// GET SIGNATURES BY FILE ID
// ===============================
const getSignaturesByFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const signatures = await Signature.find({
      fileId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json(signatures);
  } catch (error) {
    console.error("getSignaturesByFile error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// DELETE SIGNATURE
// ===============================
const deleteSignature = async (req, res) => {
  try {
    const signature = await Signature.findById(req.params.id);

    if (!signature) {
      return res.status(404).json({
        message: "Signature not found",
      });
    }

    await Signature.findByIdAndDelete(req.params.id);

    return res.json({
      message: "Signature deleted successfully",
    });
  } catch (error) {
    console.error("deleteSignature error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  saveSignature,
  getSignatures,
  getSignaturesByFile,
  deleteSignature,
};