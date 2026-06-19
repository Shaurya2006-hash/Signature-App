const Document = require("../models/Document");

const generateSignedPdf = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,
      pdfUrl: document.filePath, // Cloudinary URL
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = { generateSignedPdf };