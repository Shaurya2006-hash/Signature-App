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
      return res.status(404).json({ message: "Document not found" });
    }

    // 2. Get signature
    const signature = await Signature.findOne({ fileId: documentId });
    if (!signature) {
      return res.status(400).json({ message: "No signature found" });
    }

    // 3. Load PDF
    const pdfBytes = await axios.get(document.filePath, {
      responseType: "arraybuffer",
    });

    const pdfDoc = await PDFDocument.load(pdfBytes.data);
    const pages = pdfDoc.getPages();
    const page = pages[0];

    const { height } = page.getSize(); // ⭐ IMPORTANT FIX

    // 4. FIXED POSITIONING (Y-AXIS CONVERSION)
    const x = signature.x;
    const y = height - signature.y - 20; // ⭐ KEY FIX

    // 5. Draw signature text
    page.drawText(signature.signerName || "SIGNED", {
      x,
      y,
      size: 18,
      color: rgb(0, 0, 0),
    });

    // 6. Save PDF
    const pdfBytesFinal = await pdfDoc.save();

    // 7. Send PDF directly (NO CLOUDINARY)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=signed.pdf");

    return res.send(Buffer.from(pdfBytesFinal));

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { generateSignedPdf };