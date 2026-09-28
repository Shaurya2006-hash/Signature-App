const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const cloudinary = require("cloudinary").v2;

const Document = require("../models/Document");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =====================================================
// GET ORIGINAL PDF
// Supports both Cloudinary URLs and old local paths
// =====================================================

const getPdfBuffer = async (filePath) => {
  const normalizedPath =
    filePath.replace(/\\/g, "/");

  // Cloudinary / HTTP URL
  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://")
  ) {
    const response = await axios.get(
      normalizedPath,
      {
        responseType: "arraybuffer",
      }
    );

    return Buffer.from(response.data);
  }

  // Old local uploads
  const localPath = path.resolve(
    __dirname,
    "..",
    normalizedPath
  );

  if (!fs.existsSync(localPath)) {
    throw new Error(
      `Original PDF file not found: ${localPath}. Please upload the document again.`
    );
  }

  return fs.readFileSync(localPath);
};

// =====================================================
// UPLOAD SIGNED PDF TO CLOUDINARY
// =====================================================

const uploadSignedPdf = async (pdfBuffer) => {
  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder: "signed-pdfs",
            resource_type: "raw",
            public_id:
              `signed_${Date.now()}`,
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }

            resolve(result);
          }
        );

      stream.end(pdfBuffer);
    }
  );
};

// =====================================================
// GENERATE SIGNED PDF
// =====================================================

const generateSignedPdfForRequest =
  async (
    documentId,
    signatureRequest
  ) => {
    // -----------------------------------------------
    // 1. Find document
    // -----------------------------------------------

    const document =
      await Document.findById(
        documentId
      );

    if (!document) {
      throw new Error(
        "Document not found"
      );
    }

    if (!document.filePath) {
      throw new Error(
        "Document file path is missing"
      );
    }

    // -----------------------------------------------
    // 2. Get original PDF
    // -----------------------------------------------

    const pdfBuffer =
      await getPdfBuffer(
        document.filePath
      );

    // -----------------------------------------------
    // 3. Verify PDF
    // -----------------------------------------------

    const header =
      pdfBuffer
        .subarray(0, 5)
        .toString("ascii");

    if (header !== "%PDF-") {
      throw new Error(
        "The original document is not a valid PDF"
      );
    }

    // -----------------------------------------------
    // 4. Load PDF
    // -----------------------------------------------

    const pdfDoc =
      await PDFDocument.load(
        pdfBuffer
      );

    const pages =
      pdfDoc.getPages();

    if (!pages.length) {
      throw new Error(
        "PDF contains no pages"
      );
    }

    const page = pages[0];

    const pdfWidth =
      page.getWidth();

    const pdfHeight =
      page.getHeight();

    // -----------------------------------------------
    // 5. Signature position
    // -----------------------------------------------

    const signatureWidth = 150;
    const signatureHeight = 60;

    const x = 200;

    const y =
      pdfHeight -
      300 -
      signatureHeight;

    // -----------------------------------------------
    // 6. Draw signature
    // -----------------------------------------------

    if (
      signatureRequest.signatureType ===
      "draw"
    ) {
      if (
        !signatureRequest.signatureImage
      ) {
        throw new Error(
          "Drawn signature image is missing"
        );
      }

      const imageData =
        signatureRequest.signatureImage;

      if (
        !imageData.startsWith(
          "data:image"
        )
      ) {
        throw new Error(
          "Invalid signature image format"
        );
      }

      const parts =
        imageData.split(",");

      if (parts.length < 2) {
        throw new Error(
          "Invalid base64 signature image"
        );
      }

      const imageBytes =
        Buffer.from(
          parts[1],
          "base64"
        );

      const pngImage =
        await pdfDoc.embedPng(
          imageBytes
        );

      page.drawImage(
        pngImage,
        {
          x,
          y,
          width:
            signatureWidth,
          height:
            signatureHeight,
        }
      );
    }

    // -----------------------------------------------
    // 7. Draw typed signature
    // -----------------------------------------------

    else {
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

        case "bold":
          font =
            await pdfDoc.embedFont(
              StandardFonts.HelveticaBold
            );
          break;

        case "modern":
          font =
            await pdfDoc.embedFont(
              StandardFonts.HelveticaOblique
            );
          break;

        case "cursive":
        case "italic":
        default:
          font =
            await pdfDoc.embedFont(
              StandardFonts.HelveticaOblique
            );
      }

      page.drawText(
        signatureRequest.signerName,
        {
          x,
          y: y + 15,
          size: 18,
          font,
        }
      );
    }

    // -----------------------------------------------
    // 8. Save signed PDF to memory
    // -----------------------------------------------

    const signedPdfBytes =
      await pdfDoc.save();

    const signedPdfBuffer =
      Buffer.from(
        signedPdfBytes
      );

    // -----------------------------------------------
    // 9. Upload signed PDF to Cloudinary
    // -----------------------------------------------

    const uploaded =
      await uploadSignedPdf(
        signedPdfBuffer
      );

    console.log(
      "Signed PDF uploaded:",
      uploaded.secure_url
    );

    // -----------------------------------------------
    // 10. Return everything needed
    // -----------------------------------------------

    return {
      fileName:
        uploaded.public_id,
      downloadUrl:
        uploaded.secure_url,
      pdfBuffer:
        signedPdfBuffer,
    };
  };

module.exports = {
  generateSignedPdfForRequest,
};