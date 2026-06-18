const {
  generateSignedPdfForRequest,
} = require(
  "../services/pdfService"
);
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

const verifyToken = async (req, res) => {
  try {
    console.log("===== VERIFY TOKEN =====");
    console.log("Token:", req.params.token);

    const request = await SignatureRequest.findOne({
      token: req.params.token,
    });

    console.log("Request Found:", request);

    if (!request) {
      return res.status(404).json({
        message: "Invalid link",
      });
    }

    res.status(200).json({
      valid: true,
      request,
    });
  } catch (error) {
    console.log("VERIFY ERROR:");
    console.log(error);

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

    const {
      signerName,
      signatureType,
      signatureImage,
    } = req.body;

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

    request.signerName =
      signerName || "";

    request.signatureType =
      signatureType || "";

    request.signatureImage =
      signatureImage || "";

    request.status =
      "signed";

    request.signedAt =
      new Date();

    await request.save();
    jsconsole.log("documentId:", request.documentId);
console.log("request:", request);
    const pdfResult =
      await generateSignedPdfForRequest(
        request.documentId,
        request
      );

    request.signedPdfUrl =
      pdfResult.downloadUrl;

    await request.save();
      await sendEmail(
  request.email,
  "Document Signed Successfully",
  `Your document has been signed.

Download PDF:

${request.signedPdfUrl}`
);
   await createAuditLog(
  request.documentId,
  request.email,
  "signed",
  req.ip
);

    res.status(200).json({
      success: true,
      message:
        "Document signed successfully",
      signedPdfUrl:
        request.signedPdfUrl,
      request,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        error.message,
    });
  }
};
const rejectRequest = async (
  req,
  res
) => {
  try {
    const { token } =
      req.params;

    const { reason } =
      req.body;

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
      "rejected";

    request.reason =
      reason || "";

    await request.save();
    

    await createAuditLog(
  request.documentId,
  request.email,
  "rejected",
  req.ip,
  reason
);

    res.status(200).json({
      message:
        "Request rejected successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const getAllRequests =
async (req,res) => {

const requests =
await SignatureRequest.find();

res.json(requests);

};
const selfSignDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    let request = await SignatureRequest.findOne({
      documentId,
      email: "self-user",
    });

    if (!request) {
      request = await SignatureRequest.create({
        documentId,
        email: "self-user",
        token: "self-" + Date.now(),
        status: "signed",
        signedAt: new Date(),
      });
    } else {
      request.status = "signed";
      request.signedAt = new Date();
      await request.save();
    }

    res.json({
      success: true,
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
  rejectRequest,
  getAllRequests,
  selfSignDocument,
};