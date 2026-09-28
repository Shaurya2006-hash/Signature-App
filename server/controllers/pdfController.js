const {
  PDFDocument,
  rgb,
  StandardFonts,
} = require("pdf-lib");

const axios = require("axios");

const Document = require("../models/Document");

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

    // ==========================================
    // 1. VALIDATE INPUT
    // ==========================================

    if (!documentId) {
      return res.status(400).json({
        message: "documentId is required",
      });
    }

    if (
      signatureMode !== "draw" &&
      signatureMode !== "type"
    ) {
      return res.status(400).json({
        message:
          "Invalid signature mode. Use draw or type.",
      });
    }

    if (
      signatureMode === "type" &&
      !signerName?.trim()
    ) {
      return res.status(400).json({
        message: "Signer name is required",
      });
    }

    if (
      signatureMode === "draw" &&
      !signatureImage
    ) {
      return res.status(400).json({
        message: "Signature image is required",
      });
    }

    // ==========================================
    // 2. FIND DOCUMENT
    // ==========================================

    const document =
      await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (!document.filePath) {
      return res.status(400).json({
        message:
          "Document filePath is missing",
      });
    }

    console.log(
      "PDF document ID:",
      documentId
    );

    console.log(
      "PDF document URL:",
      document.filePath
    );

    // ==========================================
    // 3. DOWNLOAD PDF FROM CLOUDINARY
    // ==========================================

    const pdfResponse =
      await axios.get(
        document.filePath,
        {
          responseType:
            "arraybuffer",

          // Don't let axios automatically
          // reject so we can inspect the response.
          validateStatus: () => true,
        }
      );

    console.log(
      "Cloudinary response status:",
      pdfResponse.status
    );

    console.log(
      "Cloudinary content type:",
      pdfResponse.headers[
        "content-type"
      ]
    );

    // ==========================================
    // 4. CHECK HTTP RESPONSE
    // ==========================================

    if (
      pdfResponse.status < 200 ||
      pdfResponse.status >= 300
    ) {
      return res.status(500).json({
        message:
          "Unable to download original PDF from Cloudinary",
        cloudinaryStatus:
          pdfResponse.status,
      });
    }

    // ==========================================
    // 5. CONVERT RESPONSE TO BUFFER
    // ==========================================

    const originalPdfBuffer =
      Buffer.from(
        pdfResponse.data
      );

    console.log(
      "Downloaded file size:",
      originalPdfBuffer.length
    );

    // ==========================================
    // 6. VERIFY PDF HEADER
    // ==========================================
    //
    // A real PDF normally begins with:
    //
    // %PDF-
    //
    // This prevents pdf-lib from receiving
    // HTML/JSON/error data.
    //

    const pdfHeader =
      originalPdfBuffer
        .subarray(0, 5)
        .toString("ascii");

    console.log(
      "Downloaded file header:",
      pdfHeader
    );

    if (pdfHeader !== "%PDF-") {
      console.error(
        "Downloaded content is NOT a PDF."
      );

      // Show a small safe diagnostic sample.
      const sample =
        originalPdfBuffer
          .subarray(0, 100)
          .toString("utf8");

      console.error(
        "Response sample:",
        sample
      );

      return res.status(500).json({
        message:
          "Cloudinary did not return a valid PDF",
        contentType:
          pdfResponse.headers[
            "content-type"
          ],
        header: pdfHeader,
      });
    }

    // ==========================================
    // 7. LOAD PDF
    // ==========================================

    const pdfDoc =
      await PDFDocument.load(
        originalPdfBuffer
      );

    const pages =
      pdfDoc.getPages();

    if (!pages.length) {
      return res.status(400).json({
        message:
          "The PDF contains no pages",
      });
    }

    // ==========================================
    // 8. FIRST PAGE
    // ==========================================

    const page = pages[0];

    const pdfWidth =
      page.getWidth();

    const pdfHeight =
      page.getHeight();

    console.log(
      "PDF size:",
      pdfWidth,
      "x",
      pdfHeight
    );

    // ==========================================
    // 9. FRONTEND → PDF COORDINATES
    // ==========================================

    // PdfViewer uses:
    //
    // <Page width={1000} />
    //
    const frontendWidth = 1000;

    const scale =
      pdfWidth /
      frontendWidth;

    const frontendX =
      Number(x ?? 100);

    const frontendY =
      Number(y ?? 100);

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

    console.log(
      "Frontend position:",
      frontendX,
      frontendY
    );

    console.log(
      "PDF position:",
      pdfX,
      pdfY
    );

    // ==========================================
    // 10. DRAW DRAWN SIGNATURE
    // ==========================================

    if (
      signatureMode === "draw"
    ) {
      try {
        let imageBytes;

        // --------------------------------------
        // BASE64 IMAGE
        // --------------------------------------

        if (
          signatureImage.startsWith(
            "data:image"
          )
        ) {
          const parts =
            signatureImage.split(",");

          if (parts.length < 2) {
            return res.status(400).json({
              message:
                "Invalid base64 signature image",
            });
          }

          const base64Data =
            parts[1];

          imageBytes =
            Buffer.from(
              base64Data,
              "base64"
            );
        }

        // --------------------------------------
        // IMAGE URL
        // --------------------------------------

        else {
          const imageResponse =
            await axios.get(
              signatureImage,
              {
                responseType:
                  "arraybuffer",
              }
            );

          imageBytes =
            Buffer.from(
              imageResponse.data
            );
        }

        // --------------------------------------
        // EMBED PNG
        // --------------------------------------

        const pngImage =
          await pdfDoc.embedPng(
            imageBytes
          );

        // --------------------------------------
        // DRAW IMAGE
        // --------------------------------------

        page.drawImage(
          pngImage,
          {
            x: pdfX,
            y: pdfY,
            width:
              signatureWidth,
            height:
              signatureHeight,
          }
        );

        console.log(
          "Drawn signature added successfully."
        );
      } catch (error) {
        console.error(
          "DRAW SIGNATURE ERROR:",
          error
        );

        return res.status(400).json({
          message:
            "Failed to process signature image",
        });
      }
    }

    // ==========================================
    // 11. DRAW TYPED SIGNATURE
    // ==========================================

    if (
      signatureMode === "type"
    ) {
      let font;

      switch (fontStyle) {
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

      page.drawText(
        signerName.trim(),
        {
          x: pdfX,
          y:
            pdfY +
            15 * scale,
          size:
            18 * scale,
          font,
          color:
            rgb(0, 0, 0),
        }
      );

      console.log(
        "Typed signature added successfully."
      );
    }

    // ==========================================
    // 12. SAVE SIGNED PDF
    // ==========================================

    const finalPdfBytes =
      await pdfDoc.save();

    console.log(
      "Signed PDF generated successfully."
    );

    console.log(
      "Final PDF size:",
      finalPdfBytes.length
    );

    // ==========================================
    // 13. SEND PDF TO FRONTEND
    // ==========================================

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'inline; filename="signed.pdf"'
    );

    res.setHeader(
      "Content-Length",
      finalPdfBytes.length
    );

    return res.send(
      Buffer.from(finalPdfBytes)
    );

  } catch (error) {
    console.error(
      "===================================="
    );

    console.error(
      "PDF GENERATION ERROR:"
    );

    console.error(error);

    console.error(
      "===================================="
    );

    return res.status(500).json({
      message:
        error.message ||
        "Failed to generate PDF",
    });
  }
};

module.exports = {
  generatePdf,
};