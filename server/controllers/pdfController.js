const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const axios = require("axios");

const Document = require("../models/Document");
const Signature = require("../models/Signature");
const generateSignedPdf = async (req, res) => {
  try {
    const { documentId } = req.params;

    // =========================
    // 1. GET DOCUMENT
    // =========================
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // =========================
    // 2. GET SIGNATURE
    // =========================
    const signature = await Signature.findOne({ fileId: documentId });

    if (!signature) {
      return res.status(400).json({ message: "No signature found" });
    }

    // =========================
    // 3. LOAD PDF FROM URL
    // =========================
    const pdfBytes = await axios.get(document.filePath, {
      responseType: "arraybuffer",
    });

    const pdfDoc = await PDFDocument.load(pdfBytes.data);

    const pages = pdfDoc.getPages();
    const page = pages[0];

    const { height } = page.getSize();

    // FIX: convert frontend Y → PDF Y
    const x = Number(signature.x);
    const y = height - Number(signature.y) - 20;

    // =========================
    // 4. TYPE SIGNATURE (TEXT)
    // =========================
    if (signature.signerName && !signature.signatureImage) {
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      page.drawText(signature.signerName, {
        x,
        y,
        size: 18,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // =========================
    // 5. DRAW SIGNATURE (IMAGE)
    // =========================
    if (signature.signatureImage) {
      let imageBytes;

      // CASE A: base64 image (from frontend canvas)
      if (signature.signatureImage.startsWith("data:image")) {
        const base64 = signature.signatureImage.split(",")[1];
        imageBytes = Buffer.from(base64, "base64");
      }

      // CASE B: URL image (Cloudinary / stored file)
      else {
        const response = await axios.get(signature.signatureImage, {
          responseType: "arraybuffer",
        });
        imageBytes = response.data;
      }

      const pngImage = await pdfDoc.embedPng(imageBytes);

      page.drawImage(pngImage, {
        x,
        y,
        width: 150,
        height: 60,
      });
    }

    // =========================
    // 6. OPTIONAL: BOTH (FUTURE SAFE)
    // =========================
    if (signature.signatureImage && signature.signerName) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      page.drawText(signature.signerName, {
        x,
        y: y - 20,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // =========================
    // 7. SAVE PDF
    // =========================
    const pdfBytesFinal = await pdfDoc.save();

    // =========================
    // 8. RESPONSE
    // =========================
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=signed.pdf"
    );

    return res.send(Buffer.from(pdfBytesFinal));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { generateSignedPdf };