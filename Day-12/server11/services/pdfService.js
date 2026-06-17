const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const Document = require("../models/Document");
const SignatureRequest = require("../models/SignatureRequest");

const generateSignedPdfForRequest = async (
  documentId,
  signatureRequest
) => {
  const document =
    await Document.findById(
      documentId
    );

  if (!document) {
    throw new Error(
      "Document not found"
    );
  }

  const pdfPath =
    path.join(
      __dirname,
      "..",
      document.filePath
    );

  const pdfBytes =
    fs.readFileSync(
      pdfPath
    );

  const pdfDoc =
    await PDFDocument.load(
      pdfBytes
    );

  const firstPage =
    pdfDoc.getPages()[0];

  const pdfWidth =
    firstPage.getWidth();

  const pdfHeight =
    firstPage.getHeight();

  const scale =
    pdfWidth / 1000;

  if (
    signatureRequest.signatureImage
  ) {
    const base64 =
      signatureRequest.signatureImage.replace(
        /^data:image\/png;base64,/,
        ""
      );

    const pngImage =
      await pdfDoc.embedPng(
        Buffer.from(
          base64,
          "base64"
        )
      );

    firstPage.drawImage(
      pngImage,
      {
        x: 200 * scale,
        y:
          pdfHeight -
          300 * scale,
        width: 150,
        height: 60,
      }
    );
  } else {
    firstPage.drawText(
      signatureRequest.signerName,
      {
        x: 200 * scale,
        y:
          pdfHeight -
          300 * scale,
        size: 24,
      }
    );
  }

  const signedPdfBytes =
    await pdfDoc.save();

  const signedFolder =
    path.join(
      __dirname,
      "..",
      "signed"
    );

  if (
    !fs.existsSync(
      signedFolder
    )
  ) {
    fs.mkdirSync(
      signedFolder
    );
  }

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

  return {
    fileName,
    downloadUrl:
      `http://localhost:5000/signed/${fileName}`,
  };
};

module.exports = {
  generateSignedPdfForRequest,
};