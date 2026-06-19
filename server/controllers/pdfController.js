const { PDFDocument, rgb } = require("pdf-lib");
const axios = require("axios");

const Document = require("../models/Document");
const Signature = require("../models/Signature");

const generateSignedPdf = async (req, res) => {
  try {
    const { documentId } = req.params;

    // 1. Get document
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // 2. Get signature from DB
    const signature = await Signature.findOne({ fileId: documentId });

    if (!signature) {
      return res.status(400).json({
        message: "No signature found for this document",
      });
    }

    // 3. Load original PDF from Cloudinary URL
    const pdfBytes = await axios.get(document.filePath, {
      responseType: "arraybuffer",
    });

    const pdfDoc = await PDFDocument.load(pdfBytes.data);

    const pages = pdfDoc.getPages();
    const page = pages[0];

    // 4. APPLY SIGNATURE (TEXT VERSION)
    page.drawText(signature.signerName || "SIGNED", {
      x: signature.x,
      y: signature.y,
      size: 18,
      color: rgb(0, 0, 0),
    });

    // 5. OPTIONAL: also show font style (basic workaround)
    // pdf-lib does NOT fully support custom fonts easily
    // so we keep simple text rendering

    // 6. Save modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // 7. Return PDF as file (NOT just URL)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=signed-${document.originalName}`
    );

    return res.send(Buffer.from(modifiedPdfBytes));
  } catch (error) {
    console.error("PDF generation error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = { generateSignedPdf };