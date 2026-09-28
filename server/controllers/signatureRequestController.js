const SignatureRequest =
  require("../models/SignatureRequest");

const Document =
  require("../models/Document");

const Audit =
  require("../models/Audit");

const Signature =
  require("../models/Signature");

const {
  sendEmail,
  sendEmailWithAttachment,
} = require("../utils/sendEmail");

const {
  generateSignedPdfForRequest,
} = require("../services/pdfService");

const { v4: uuidv4 } =
  require("uuid");

// =====================================================
// CREATE REQUEST
// =====================================================

const createSignatureRequest =
  async (req, res) => {
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
        await Document.findById(
          documentId
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
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

        <p>Please review and sign the document.</p>

        <p>
          <a href="${signingLink}">
            Open Document
          </a>
        </p>
        `
      );

      res.status(201).json(
        request
      );
    } catch (error) {
      console.error(
        "CREATE REQUEST ERROR:",
        error
      );

      res.status(500).json({
        message:
          error.message,
      });
    }
  };

// =====================================================
// GET ALL REQUESTS
// =====================================================

const getSignatureRequests =
  async (req, res) => {
    try {
      const requests =
        await SignatureRequest.find()
          .sort({
            createdAt: -1,
          });

      res.json(requests);
    } catch (error) {
      res.status(500).json({
        message:
          error.message,
      });
    }
  };

// =====================================================
// SELF SIGN STATUS
// =====================================================

const updateSelfSignStatus =
  async (req, res) => {
    try {
      const request =
        await SignatureRequest.findById(
          req.params.id
        );

      if (!request) {
        return res.status(404).json({
          message:
            "Signature request not found",
        });
      }

      request.status =
        "signed";

      request.signedAt =
        new Date();

      await request.save();

      res.json(request);
    } catch (error) {
      res.status(500).json({
        message:
          error.message,
      });
    }
  };

// =====================================================
// GET REQUEST BY TOKEN
// =====================================================

const getRequestByToken =
  async (req, res) => {
    try {
      const request =
        await SignatureRequest
          .findOne({
            token:
              req.params.token,
          })
          .populate(
            "documentId"
          );

      if (!request) {
        return res.status(404).json({
          message:
            "Invalid Link",
        });
      }

      res.json(request);
    } catch (error) {
      res.status(500).json({
        message:
          error.message,
      });
    }
  };

// =====================================================
// SIGN DOCUMENT
// =====================================================

const signDocument =
  async (req, res) => {
    try {
      const {
        signerName,
        fontStyle,
        signatureType,
        signatureImage,
      } = req.body;

      // -----------------------------------------------
      // 1. Find request
      // -----------------------------------------------

      const request =
        await SignatureRequest.findOne({
          token:
            req.params.token,
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Invalid Request",
        });
      }

      // -----------------------------------------------
      // 2. Prevent signing twice
      // -----------------------------------------------

      if (
        request.status ===
        "signed"
      ) {
        return res.status(400).json({
          message:
            "Document is already signed",
        });
      }

      if (
        request.status ===
        "rejected"
      ) {
        return res.status(400).json({
          message:
            "Document has already been rejected",
        });
      }

      // -----------------------------------------------
      // 3. Validate signature
      // -----------------------------------------------

      if (
        signatureType !==
          "type" &&
        signatureType !==
          "draw"
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

      // -----------------------------------------------
      // 4. Verify document
      // -----------------------------------------------

      const document =
        await Document.findById(
          request.documentId
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      // -----------------------------------------------
      // 5. Save signature information
      // -----------------------------------------------

      await Signature.create({
        fileId:
          request.documentId,

        signer:
          request.email,

        signerName:
          signerName || "",

        fontStyle:
          fontStyle || "italic",

        signatureImage:
          signatureType === "draw"
            ? signatureImage
            : null,

        x: 200,

        y: 300,

        status:
          "signed",
      });

      // -----------------------------------------------
      // 6. Generate signed PDF
      // -----------------------------------------------

      const signedPdf =
        await generateSignedPdfForRequest(
          request.documentId,
          {
            signerName:
              signerName || "",
            fontStyle:
              fontStyle || "italic",
            signatureType,
            signatureImage:
              signatureImage || "",
          }
        );

      // -----------------------------------------------
      // 7. Update request
      // -----------------------------------------------

      request.signerName =
        signerName || "";

      request.signatureType =
        signatureType;

      request.signatureImage =
        signatureType === "draw"
          ? signatureImage
          : "";

      request.signedPdfUrl =
        signedPdf.downloadUrl;

      request.status =
        "signed";

      request.signedAt =
        new Date();

      await request.save();

      // -----------------------------------------------
      // 8. Create audit log
      // -----------------------------------------------

      const ipAddress =
        req.headers[
          "x-forwarded-for"
        ]?.split(",")[0] ||
        req.socket.remoteAddress ||
        "";

      await Audit.create({
        fileId:
          request.documentId,

        email:
          request.email,

        action:
          "signed",

        ipAddress,

        reason: "",
      });

      // -----------------------------------------------
      // 9. Email signed PDF to signer
      // -----------------------------------------------

      await sendEmailWithAttachment(
        request.email,

        "Document Signed Successfully",

        `
        <h2>Document Signed Successfully</h2>

        <p>
          Hello ${signerName || "Signer"},
        </p>

        <p>
          Your signed document is attached
          to this email.
        </p>

        <p>
          You can also access the signed
          document here:
        </p>

        <p>
          <a href="${signedPdf.downloadUrl}">
            View Signed PDF
          </a>
        </p>

        <p>
          Thank you.
        </p>
        `,

        signedPdf.pdfBuffer,

        "signed-document.pdf"
      );

      // -----------------------------------------------
      // 10. Success
      // -----------------------------------------------

      return res.json({
        success: true,

        message:
          "Document signed successfully",

        signedPdfUrl:
          signedPdf.downloadUrl,

        status:
          request.status,
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

// =====================================================
// REJECT DOCUMENT
// =====================================================

const rejectDocument =
  async (req, res) => {
    try {
      const request =
        await SignatureRequest.findOne({
          token:
            req.params.token,
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Invalid Request",
        });
      }

      if (
        request.status ===
        "signed"
      ) {
        return res.status(400).json({
          message:
            "Document has already been signed",
        });
      }

      request.status =
        "rejected";

      request.reason =
        req.body.reason || "";

      await request.save();

      // -----------------------------------------------
      // Audit rejection
      // -----------------------------------------------

      const ipAddress =
        req.headers[
          "x-forwarded-for"
        ]?.split(",")[0] ||
        req.socket.remoteAddress ||
        "";

      await Audit.create({
        fileId:
          request.documentId,

        email:
          request.email,

        action:
          "rejected",

        ipAddress,

        reason:
          request.reason,
      });

      // -----------------------------------------------
      // Email owner
      // -----------------------------------------------

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
          <strong>Reason:</strong>
          ${request.reason}
        </p>
        `
      );

      res.json({
        success: true,
      });

    } catch (error) {
      console.error(
        "REJECT DOCUMENT ERROR:",
        error
      );

      res.status(500).json({
        message:
          error.message,
      });
    }
  };

module.exports = {
  createSignatureRequest,
  getSignatureRequests,
  updateSelfSignStatus,
  getRequestByToken,
  signDocument,
  rejectDocument,
};