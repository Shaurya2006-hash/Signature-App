const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const Document = require("../models/Document");
const Signature = require("../models/Signature");

const generateSignedPdf = async (
  req,
  res
) => {
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

    /*
    =========================
    ORIGINAL PDF PATH
    =========================
    */

    const cleanPath = document.filePath
      .replace(/\\/g, "/")  // FIX: backslashes → forward slashes (Linux fix)
      .replace(/^\/+/, ""); // strip leading slashes

    const pdfPath =
      path.join(
        __dirname,
        "..",
        cleanPath
      );

    console.log(
      "PDF Path:",
      pdfPath
    );

    if (
      !fs.existsSync(pdfPath)
    ) {
      return res.status(404).json({
        message:
          "Physical PDF file not found",
        path: pdfPath,
      });
    }

    /*
    =========================
    LOAD PDF
    =========================
    */

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
      pdfWidth / viewerWidth;

    /*
    =========================
    FONT SIZE
    =========================
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
    =========================
    IMAGE SIGNATURE
    =========================
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
      =========================
      TYPED SIGNATURE
      =========================
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

    /*
    =========================
    SAVE PDF
    =========================
    */

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
        signedFolder,
        {
          recursive: true,
        }
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

    console.log(
      "Signed PDF saved:",
      outputPath
    );

    console.log(
      "Exists:",
      fs.existsSync(
        outputPath
      )
    );

    /*
    =========================
    URL FOR LOCAL + RENDER
    =========================
    */

    const baseUrl =
      process.env
        .BACKEND_URL ||
      `http://localhost:${
        process.env.PORT ||
        5000
      }`;

    const downloadUrl =
      `${baseUrl}/signed/${signedFileName}`;

    console.log(
      "Download URL:",
      downloadUrl
    );

    return res.status(200).json({
      message:
        "Signed PDF generated successfully",

      fileName:
        signedFileName,

      downloadUrl,
    });
  } catch (error) {
    console.error(
      "Generate PDF Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

module.exports = {
  generateSignedPdf,
};