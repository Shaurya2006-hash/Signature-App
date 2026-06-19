const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const axios = require("axios");

const Document = require("../models/Document");
const Signature = require("../models/Signature");

const generatePdf = async (req, res) => {
  try {
    const {
      documentId,
      x,
      y,
      signerName,
      fontStyle,
      signatureImage,
      signatureMode,
    } = req.body;

    // =========================
    // 1. GET DOCUMENT
    // =========================
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // =========================
    // 2. LOAD PDF
    // =========================
    const pdfBytes = await axios.get(document.filePath, {
      responseType: "arraybuffer",
    });

    const pdfDoc = await PDFDocument.load(pdfBytes.data);
    const page = pdfDoc.getPages()[0];

    const { height } = page.getSize();

    const pdfX = Number(x || 100);
    const pdfY = height - Number(y || 100) - 20;

    // =========================
    // 3. FETCH SAVED SIGNATURES (IMPORTANT FIX)
    // =========================
    const signatures = await Signature.find({ fileId: documentId });

    // =========================
    // 4. PRIORITY: USE DB SIGNATURES FIRST
    // =========================
    if (signatures && signatures.length > 0) {
      for (const sig of signatures) {
        const sx = Number(sig.x);
        const sy = height - Number(sig.y) - 20;

        // TYPE SIGNATURE
        if (sig.signerName && !sig.signatureImage) {
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

          page.drawText(sig.signerName, {
            x: sx,
            y: sy,
            size: 18,
            font,
            color: rgb(0, 0, 0),
          });
        }

        // DRAW SIGNATURE (IMAGE)
        if (sig.signatureImage) {
          let imageBytes;

          // base64
          if (sig.signatureImage.startsWith("data:image")) {
            const base64 = sig.signatureImage.split(",")[1];
            imageBytes = Buffer.from(base64, "base64");
          } else {
            const imgRes = await axios.get(sig.signatureImage, {
              responseType: "arraybuffer",
            });
            imageBytes = imgRes.data;
          }

          const pngImage = await pdfDoc.embedPng(imageBytes);

          page.drawImage(pngImage, {
            x: sx,
            y: sy,
            width: 150,
            height: 60,
          });
        }
      }
    }
    // =========================
    // 5. FALLBACK: FRONTEND SIGNATURE (if DB empty)
    // =========================
    else {
      if (signatureMode === "type" && signerName) {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        page.drawText(signerName, {
          x: pdfX,
          y: pdfY,
          size: 18,
          font,
          color: rgb(0, 0, 0),
        });
      }

      if (signatureMode === "draw" && signatureImage) {
        const base64 = signatureImage.split(",")[1];
        const imageBytes = Buffer.from(base64, "base64");

        const pngImage = await pdfDoc.embedPng(imageBytes);

        page.drawImage(pngImage, {
          x: pdfX,
          y: pdfY,
          width: 150,
          height: 60,
        });
      }
    }

    // =========================
    // 6. SAVE PDF
    // =========================
    const pdfBytesFinal = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=signed.pdf"
    );

    return res.send(Buffer.from(pdfBytesFinal));
  } catch (error) {
    console.error("PDF ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { generatePdf };