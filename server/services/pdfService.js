const fs = require("fs");
const path = require("path");
const axios = require("axios");

const {
  PDFDocument,
  rgb,
  StandardFonts,
} = require("pdf-lib");

const Document = require("../models/Document");

const generateSignedPdfForRequest = async (
  documentId,
  signatureRequest
) => {
  // ==========================================
  // 1. GET ORIGINAL DOCUMENT
  // ==========================================

  const document = await Document.findById(documentId);

  if (!document) {
    throw new Error("Document not found");
  }

  if (!document.filePath) {
    throw new Error("Document file path not found");
  }

  // ==========================================
  // 2. DOWNLOAD ORIGINAL PDF
  // ==========================================

  const pdfResponse = await axios.get(
    document.filePath,
    {
      responseType: "arraybuffer",
    }
  );

  // ==========================================
  // 3. LOAD PDF
  // ==========================================

  const pdfDoc = await PDFDocument.load(
    pdfResponse.data
  );

  const pages = pdfDoc.getPages();

  if (!pages.length) {
    throw new Error("PDF has no pages");
  }

  const firstPage = pages[0];

  const pdfWidth = firstPage.getWidth();
  const pdfHeight = firstPage.getHeight();

  // ==========================================
  // 4. SIGNATURE POSITION
  // ==========================================

  const frontendWidth = 1000;

  const scale =
    pdfWidth / frontendWidth;

  const frontendX = 200;
  const frontendY = 300;

  const pdfX =
    frontendX * scale;

  const signatureWidth =
    150 * scale;

  const signatureHeight =
    60 * scale;

  const pdfY =
    pdfHeight -
    frontendY * scale -
    signatureHeight;

  // ==========================================
  // 5. DRAW SIGNATURE IMAGE
  // ==========================================

  if (signatureRequest.signatureImage) {
    const signatureImage =
      signatureRequest.signatureImage;

    let imageBytes;

    if (
      signatureImage.startsWith("data:image")
    ) {
      const parts =
        signatureImage.split(",");

      if (parts.length < 2) {
        throw new Error(
          "Invalid signature image"
        );
      }

      imageBytes = Buffer.from(
        parts[1],
        "base64"
      );
    } else {
      const imageResponse =
        await axios.get(
          signatureImage,
          {
            responseType:
              "arraybuffer",
          }
        );

      imageBytes = Buffer.from(
        imageResponse.data
      );
    }

    const pngImage =
      await pdfDoc.embedPng(
        imageBytes
      );

    firstPage.drawImage(
      pngImage,
      {
        x: pdfX,
        y: pdfY,
        width: signatureWidth,
        height: signatureHeight,
      }
    );
  }

  // ==========================================
  // 6. DRAW TYPED SIGNATURE
  // ==========================================

  else if (
    signatureRequest.signerName
  ) {
    let font;

    switch (
      signatureRequest.fontStyle
    ) {
      case "elegant":
        font =
          await pdfDoc.embedFont(
            StandardFonts.TimesItalic
          );
        break;

      case "modern":
        font =
          await pdfDoc.embedFont(
            StandardFonts.HelveticaOblique
          );
        break;

      case "bold":
        font =
          await pdfDoc.embedFont(
            StandardFonts.HelveticaBold
          );
        break;

      default:
        font =
          await pdfDoc.embedFont(
            StandardFonts.HelveticaOblique
          );
    }

    firstPage.drawText(
      signatureRequest.signerName,
      {
        x: pdfX,
        y: pdfY + 15 * scale,
        size: 18 * scale,
        font,
        color: rgb(0, 0, 0),
      }
    );
  }

  else {
    throw new Error(
      "No signature information found"
    );
  }

  // ==========================================
  // 7. SAVE SIGNED PDF
  // ==========================================

  const signedPdfBytes =
    await pdfDoc.save();

  // ==========================================
  // 8. CREATE SIGNED FOLDER
  // ==========================================

  const signedFolder =
    path.join(
      __dirname,
      "..",
      "signed"
    );

  if (!fs.existsSync(signedFolder)) {
    fs.mkdirSync(
      signedFolder,
      {
        recursive: true,
      }
    );
  }

  // ==========================================
  // 9. CREATE FILE
  // ==========================================

  const fileName =
    `signed_${Date.now()}.pdf`;

  const outputPath =
    path.join(
      signedFolder,
      fileName
    );

  fs.writeFileSync(
    outputPath,
    signedPdfBytes
  );

  // ==========================================
  // 10. RETURN INFORMATION
  // ==========================================

  return {
    fileName,

    outputPath,

    pdfBytes: Buffer.from(
      signedPdfBytes
    ),

    downloadUrl:
      `${process.env.BACKEND_URL || "http://localhost:5000"}/signed/${fileName}`,
  };
};

module.exports = {
  generateSignedPdfForRequest,
};