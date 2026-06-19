const { PDFDocument, rgb } = require("pdf-lib");
const axios = require("axios");

const Document = require("../models/Document");
const Signature = require("../models/Signature");

const { PDFDocument, rgb } = require("pdf-lib");
const axios = require("axios");

const Document = require("../models/Document");
const Signature = require("../models/Signature");

const generateSignedPdf = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const signature = await Signature.findOne({ fileId: documentId });

    if (!signature) {
      return res.status(400).json({ message: "No signature found" });
    }

    // 1. Fetch original PDF
    const pdfBytes = await axios.get(document.filePath, {
      responseType: "arraybuffer",
    });

    const pdfDoc = await PDFDocument.load(pdfBytes.data);

    const page = pdfDoc.getPages()[0];

    // 2. Apply signature (TEXT VERSION)
    page.drawText(signature.signerName || "SIGNED", {
      x: signature.x,
      y: signature.y,
      size: 18,
      color: rgb(0, 0, 0),
    });

    // 3. Generate final PDF
    const finalPdfBytes = await pdfDoc.save();

    // 4. RETURN PDF AS FILE (NO CLOUDINARY)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=signed.pdf");

    return res.send(Buffer.from(finalPdfBytes));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { generateSignedPdf };