const Document = require("../models/Document");

const generateSignedPdf = async (req, res) => {
  try {
    const { documentId } = req.params;

    // 1. Find document in DB
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // 2. Return Cloudinary PDF URL (or original filePath)
    return res.status(200).json({
      success: true,
      message: "PDF fetched successfully",
      documentId: document._id,
      pdfUrl: document.filePath, // Cloudinary URL
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  generateSignedPdf,
};