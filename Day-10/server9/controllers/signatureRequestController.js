const SignatureRequest =
  require("../models/SignatureRequest");

const crypto =
  require("crypto");

const sendEmail =
  require("../utils/sendEmail");

const createAuditLog =
  require(
    "../middleware/auditMiddleware"
  );

const createRequest = async (
  req,
  res
) => {
  try {
    const {
      documentId,
      email,
    } = req.body;

    const token =
      crypto
        .randomBytes(32)
        .toString("hex");

    const request =
      await SignatureRequest.create({
        documentId,
        email,
        token,
      });

    const signLink =
      `http://localhost:5173/sign/${token}`;

    await sendEmail(
      email,
      "Document Signature Request",
      `Please sign the document using this link:\n\n${signLink}`
    );

    res.status(201).json({
      message:
        "Request created successfully",
      token,
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const verifyToken = async (
  req,
  res
) => {
  try {
    const { token } =
      req.params;

    const request =
      await SignatureRequest.findOne({
        token,
      });

    if (!request) {
      return res.status(404).json({
        message:
          "Invalid link",
      });
    }

    res.status(200).json({
      valid: true,
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const markSigned = async (
  req,
  res
) => {
  try {
    const { token } =
      req.params;

    const request =
      await SignatureRequest.findOne({
        token,
      });

    if (!request) {
      return res.status(404).json({
        message:
          "Invalid token",
      });
    }

    request.status =
      "signed";

    await request.save();

    // Day 10 Audit Log
    await createAuditLog(
      request.documentId,
      request.email,
      "SIGNED",
      req.ip
    );

    res.status(200).json({
      message:
        "Document signed successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createRequest,
  verifyToken,
  markSigned,
};