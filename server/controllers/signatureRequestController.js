const SignatureRequest = require("../models/SignatureRequest");
const Document = require("../models/Document");
const Signature = require("../models/Signature");
const Audit = require("../models/Audit");

const sendEmail = require("../utils/sendEmail");

const {
  generateSignedPdfForRequest,
} = require("../services/pdfService");

const { v4: uuidv4 } = require("uuid");

// ======================================================
// CREATE SIGNATURE REQUEST
// ======================================================

const createSignatureRequest = async (
  req,
  res
) => {
  try {
    const {
      email,
      documentId,
    } = req.body;

    if (!email || !documentId) {
      return res.status(400).json({
        message:
          "Email and documentId are required",
      });
    }

    const document =
      await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const token = uuidv4();

    const request =
      await SignatureRequest.create({
        email,
        documentId,
        token,
      });

    const signingLink =
      `${process.env.FRONTEND_URL}/sign/${token}`;

    await sendEmail(
      email,
      "Signature Request",
      `
        <h2>Document Signature Request</h2>

        <p>
          You have been requested to sign a document.
        </p>

        <p>
          <a href="${signingLink}">
            Open Document and Sign
          </a>
        </p>
      `
    );

    res.status(201).json(request);

  } catch (error) {
    console.error(
      "CREATE SIGNATURE REQUEST ERROR:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// ======================================================
// GET ALL REQUESTS
// ======================================================

const getSignatureRequests = async (
  req,
  res
) => {
  try {
    const requests =
      await SignatureRequest.find()
        .sort({
          createdAt: -1,
        });

    res.json(requests);

  } catch (error) {
    console.error(
      "GET SIGNATURE REQUESTS ERROR:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// ======================================================
// SELF SIGN
// ======================================================

const updateSelfSignStatus = async (
  req,
  res
) => {
  try {
    const request =
      await SignatureRequest.findByIdAndUpdate(
        req.params.id,
        {
          status: "signed",
          signedAt: new Date(),
        },
        {
          new: true,
        }
      );

    if (!request) {
      return res.status(404).json({
        message:
          "Signature request not found",
      });
    }

    res.json(request);

  } catch (error) {
    console.error(
      "SELF SIGN ERROR:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// ======================================================
// GET REQUEST BY TOKEN
// ======================================================

const getRequestByToken = async (
  req,
  res
) => {
  try {
    const request =
      await SignatureRequest.findOne({
        token: req.params.token,
      }).populate("documentId");

    if (!request) {
      return res.status(404).json({
        message: "Invalid Link",
      });
    }

    res.json(request);

  } catch (error) {
    console.error(
      "GET REQUEST BY TOKEN ERROR:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// ======================================================
// SIGN DOCUMENT
// ======================================================

const signDocument = async (
  req,
  res
) => {
  try {

    // ----------------------------------------------
    // 1. FIND SIGNATURE REQUEST
    // ----------------------------------------------

    const request =
      await SignatureRequest.findOne({
        token: req.params.token,
      });

    if (!request) {
      return res.status(404).json({
        message: "Invalid Request",
      });
    }

    // ----------------------------------------------
    // 2. PREVENT SIGNING TWICE
    // ----------------------------------------------

    if (request.status === "signed") {
      return res.status(400).json({
        message:
          "This document has already been signed",
      });
    }

    if (request.status === "rejected") {
      return res.status(400).json({
        message:
          "This document has already been rejected",
      });
    }

    // ----------------------------------------------
    // 3. GET SIGNATURE DATA FROM FRONTEND
    // ----------------------------------------------

    const {
      signerName,
      fontStyle,
      signatureType,
      signatureImage,
    } = req.body;

    // ----------------------------------------------
    // 4. VALIDATE SIGNATURE
    // ----------------------------------------------

    if (
      signatureType !== "type" &&
      signatureType !== "draw"
    ) {
      return res.status(400).json({
        message:
          "Invalid signature type",
      });
    }

    if (
      signatureType === "type" &&
      !signerName?.trim()
    ) {
      return res.status(400).json({
        message:
          "Signer name is required",
      });
    }

    if (
      signatureType === "draw" &&
      !signatureImage
    ) {
      return res.status(400).json({
        message:
          "Signature image is required",
      });
    }

    // ----------------------------------------------
    // 5. GET DOCUMENT
    // ----------------------------------------------

    const document =
      await Document.findById(
        request.documentId
      );

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // ----------------------------------------------
    // 6. SAVE SIGNER INFORMATION IN REQUEST
    // ----------------------------------------------

    request.signerName =
      signerName?.trim() || "";

    request.fontStyle =
      fontStyle || "italic";

    request.signatureType =
      signatureType;

    request.signatureImage =
      signatureType === "draw"
        ? signatureImage
        : "";

    // ----------------------------------------------
    // 7. GENERATE SIGNED PDF
    // ----------------------------------------------

    console.log(
      "Generating signed PDF..."
    );

    const signedPdf =
      await generateSignedPdfForRequest(
        request.documentId,
        request
      );

    console.log(
      "Signed PDF generated:",
      signedPdf.fileName
    );

    // ----------------------------------------------
    // 8. UPDATE REQUEST STATUS
    // ----------------------------------------------

    request.status = "signed";

    request.signedAt =
      new Date();

    request.signedPdfUrl =
      signedPdf.downloadUrl;

    await request.save();

    console.log(
      "Signature request status:",
      request.status
    );

    // ----------------------------------------------
    // 9. SAVE SIGNATURE RECORD
    // ----------------------------------------------

    await Signature.create({
      fileId: request.documentId,

      // Actual person who signed
      signer: request.email,

      signerName:
        request.signerName || "",

      fontStyle:
        request.fontStyle || "italic",

      signatureImage:
        request.signatureImage || null,

      // Same default position used by pdfService
      x: 200,
      y: 300,

      status: "signed",
    });

    console.log(
      "Signature record saved"
    );

    // ----------------------------------------------
    // 10. GET SIGNER IP ADDRESS
    // ----------------------------------------------

    const forwardedFor =
      req.headers["x-forwarded-for"];

    const ipAddress =
      forwardedFor
        ? forwardedFor
            .split(",")[0]
            .trim()
        : req.ip ||
          req.socket?.remoteAddress ||
          "";

    // ----------------------------------------------
    // 11. CREATE AUDIT LOG
    // ----------------------------------------------

    await Audit.create({
      fileId: request.documentId,

      // IMPORTANT:
      // This is the actual signer
      email: request.email,

      action: "SIGNED",

      ipAddress,

      reason: "",
    });

    console.log(
      "Audit log created"
    );

    // ----------------------------------------------
    // 12. EMAIL SIGNED PDF TO SIGNER
    // ----------------------------------------------

    await sendEmail(
      request.email,

      "Your Document Has Been Signed",

      `
        <h2>Document Signed Successfully</h2>

        <p>
          Hello ${request.signerName || "Signer"},
        </p>

        <p>
          Your signature has been successfully
          added to the document.
        </p>

        <p>
          The signed PDF is attached to this email.
        </p>

        <p>
          Thank you.
        </p>
      `,

      [
        {
          filename:
            signedPdf.fileName,

          content:
            signedPdf.pdfBytes,
        },
      ]
    );

    console.log(
      "Signed PDF emailed to:",
      request.email
    );

    // ----------------------------------------------
    // 13. OPTIONAL OWNER NOTIFICATION
    // ----------------------------------------------

    if (
      process.env.OWNER_EMAIL &&
      process.env.OWNER_EMAIL !== request.email
    ) {
      await sendEmail(
        process.env.OWNER_EMAIL,

        "Document Signed",

        `
          <h2>Document Signed</h2>

          <p>
            ${request.email}
            signed the document.
          </p>

          <p>
            Signer name:
            ${request.signerName || "Not provided"}
          </p>
        `
      );
    }

    // ----------------------------------------------
    // 14. SUCCESS RESPONSE
    // ----------------------------------------------

    return res.json({
      success: true,

      message:
        "Document signed successfully",

      status:
        request.status,

      signedAt:
        request.signedAt,

      signedPdfUrl:
        request.signedPdfUrl,
    });

  } catch (error) {

    console.error(
      "SIGN DOCUMENT ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Failed to sign document",
    });
  }
};

// ======================================================
// REJECT DOCUMENT
// ======================================================

const rejectDocument = async (
  req,
  res
) => {
  try {

    const request =
      await SignatureRequest.findOne({
        token: req.params.token,
      });

    if (!request) {
      return res.status(404).json({
        message: "Invalid Request",
      });
    }

    if (request.status === "signed") {
      return res.status(400).json({
        message:
          "Signed document cannot be rejected",
      });
    }

    request.status = "rejected";

    request.reason =
      req.body.reason || "";

    await request.save();

    // ----------------------------------------------
    // AUDIT LOG FOR REJECTION
    // ----------------------------------------------

    const forwardedFor =
      req.headers["x-forwarded-for"];

    const ipAddress =
      forwardedFor
        ? forwardedFor
            .split(",")[0]
            .trim()
        : req.ip ||
          req.socket?.remoteAddress ||
          "";

    await Audit.create({
      fileId: request.documentId,

      email: request.email,

      action: "REJECTED",

      ipAddress,

      reason: request.reason,
    });

    // ----------------------------------------------
    // OWNER EMAIL
    // ----------------------------------------------

    await sendEmail(
      process.env.OWNER_EMAIL,
      "Document Rejected",
      `
        <h2>Document Rejected</h2>

        <p>
          ${request.email}
          rejected the document.
        </p>

        <p>
          Reason:
          ${request.reason}
        </p>
      `
    );

    res.json({
      success: true,
      message:
        "Document rejected successfully",
    });

  } catch (error) {

    console.error(
      "REJECT DOCUMENT ERROR:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createSignatureRequest,
  getSignatureRequests,
  updateSelfSignStatus,
  getRequestByToken,
  signDocument,
  rejectDocument,
};