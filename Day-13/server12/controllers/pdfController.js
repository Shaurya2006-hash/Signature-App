const fs = require("fs");
const path = require("path");
const { PDFDocument } =
  require("pdf-lib");

const Document =
  require("../models/Document");

const Signature =
  require("../models/Signature");

const generateSignedPdf =
  async (req, res) => {
    try {
      const { documentId } =
        req.params;

      const document =
        await Document.findById(
          documentId
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      const signature =
        await Signature.findOne({
          fileId: documentId,
        });

      if (!signature) {
        return res.status(404).json({
          message:
            "Signature not found",
        });
      }

      const pdfPath =
        path.join(
          __dirname,
          "..",
          document.filePath
        );

      if (
        !fs.existsSync(pdfPath)
      ) {
        return res.status(404).json({
          message:
            "Physical PDF file not found",
        });
      }

      const pdfBytes =
        fs.readFileSync(
          pdfPath
        );

      const pdfDoc =
        await PDFDocument.load(
          pdfBytes
        );

      const pages =
        pdfDoc.getPages();

      const firstPage =
        pages[0];

      const pdfWidth =
        firstPage.getWidth();

      const pdfHeight =
        firstPage.getHeight();

      const viewerWidth =
        1000;

      const scale =
        pdfWidth /
        viewerWidth;

      /*
      ------------------------
      FONT SIZE LOGIC
      ------------------------
      */

      let fontSize = 20;

      if (
        signature.fontStyle ===
        "bold"
      ) {
        fontSize = 28;
      }

      if (
        signature.fontStyle ===
        "elegant"
      ) {
        fontSize = 24;
      }

      if (
        signature.fontStyle ===
        "cursive"
      ) {
        fontSize = 22;
      }

      /*
      ------------------------
      DRAW IMAGE SIGNATURE
      ------------------------
      */

      if (
        signature.signatureImage
      ) {
        const base64Data =
          signature.signatureImage.replace(
            /^data:image\/png;base64,/,
            ""
          );

        const imageBuffer =
          Buffer.from(
            base64Data,
            "base64"
          );

        const pngImage =
          await pdfDoc.embedPng(
            imageBuffer
          );

        firstPage.drawImage(
          pngImage,
          {
            x:
              signature.x *
              scale,

            y:
              pdfHeight -
              signature.y *
                scale,

            width: 150,

            height: 60,
          }
        );
      } else {
        /*
        ------------------------
        DRAW TYPED SIGNATURE
        ------------------------
        */

        firstPage.drawText(
          signature.signerName ||
            signature.signer,
          {
            x:
              signature.x *
              scale,

            y:
              pdfHeight -
              signature.y *
                scale,

            size:
              fontSize,
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

      const signedFileName =
        `signed_${Date.now()}.pdf`;

      const outputPath =
        path.join(
          signedFolder,
          signedFileName
        );

      fs.writeFileSync(
        outputPath,
        signedPdfBytes
      );

      res.status(200).json({
        message:
          "Signed PDF generated successfully",

        fileName:
          signedFileName,

        downloadUrl:
          `http://localhost:5000/signed/${signedFileName}`,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          error.message,
      });
    }
  };

module.exports = {
  generateSignedPdf,
};