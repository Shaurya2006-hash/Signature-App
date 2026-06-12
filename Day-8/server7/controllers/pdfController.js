const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const Document = require("../models/Document");
const Signature = require("../models/Signature");

const generateSignedPdf = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(
      documentId
    );

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const signature =
      await Signature.findOne({
        fileId: documentId,
      });

    if (!signature) {
      return res.status(404).json({
        message: "Signature not found",
      });
    }

    const pdfPath = path.join(
      __dirname,
      "..",
      document.filePath
    );

    const pdfBytes =
      fs.readFileSync(pdfPath);

    const pdfDoc =
      await PDFDocument.load(
        pdfBytes
      );

    const pages =
      pdfDoc.getPages();

    const firstPage =
      pages[0];

    firstPage.drawText(
      signature.signer,
      {
        x: signature.x,
        y:
          firstPage.getHeight() -
          signature.y,
        size: 24,
      }
    );

    const signedPdfBytes =
      await pdfDoc.save();

    const signedFileName =
      `signed_${Date.now()}.pdf`;

    const outputPath = path.join(
      __dirname,
      "..",
      "signed",
      signedFileName
    );

    fs.writeFileSync(
      outputPath,
      signedPdfBytes
    );

    res.status(200).json({
      message:
        "Signed PDF generated successfully",
      fileName: signedFileName,
      downloadUrl:
        `http://localhost:5000/signed/${signedFileName}`,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  generateSignedPdf,
};