
const {
  generateSignedPdfForRequest,
} = require("../services/pdfService");
 
const SignatureRequest = require("../models/SignatureRequest");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const createAuditLog = require("../middleware/auditMiddleware");
 
// ─── Create Request ───────────────────────────────────────────────────────────
 
const createRequest = async (req, res) => {
  try {
    console.log("===== CREATE REQUEST =====");
    console.log("Body:", req.body);
 
    const { documentId, email } = req.body;
 
    if (!documentId || !email) {
      return res.status(400).json({ message: "documentId and email are required" });
    }
 
    const token = crypto.randomBytes(32).toString("hex");
 
    const request = await SignatureRequest.create({
      documentId,
      email,
      token,
    });
 
    const signLink = `http://localhost:5173/sign/${token}`;
 
    await sendEmail(
      email,
      "Document Signature Request",
      `Please sign the document using this link:\n\n${signLink}`
    );
 
    res.status(201).json({
      message: "Request created successfully",
      token,
      request,
    });
  } catch (error) {
    console.error("CREATE REQUEST ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
 
// ─── Verify Token ─────────────────────────────────────────────────────────────
 
const verifyToken = async (req, res) => {
  try {
    console.log("===== VERIFY TOKEN =====");
    console.log("Token:", req.params.token);
 
    const request = await SignatureRequest.findOne({
      token: req.params.token,
    });
 
    console.log("Request Found:", request);
 
    if (!request) {
      return res.status(404).json({ message: "Invalid link" });
    }
 
    res.status(200).json({ valid: true, request });
  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
 
// ─── Mark Signed ──────────────────────────────────────────────────────────────
 
const markSigned = async (req, res) => {
  try {
    console.log("===== MARK SIGNED =====");
    const { token } = req.params;
    const { signerName, fontStyle, signatureType, signatureImage } = req.body;
 
    console.log("Token:", token);
    console.log("Body:", req.body);
 
    const request = await SignatureRequest.findOne({ token });
 
    if (!request) {
      console.error("No request found for token:", token);
      return res.status(404).json({ message: "Invalid token" });
    }
 
    if (request.status === "signed") {
      return res.status(400).json({ message: "Document already signed" });
    }
 
    if (request.status === "rejected") {
      return res.status(400).json({ message: "Document has been rejected and cannot be signed" });
    }
 
    // Validate: for typed signatures, signerName is required
    if (signatureType === "type" && !signerName?.trim()) {
      return res.status(400).json({ message: "Signer name is required for typed signatures" });
    }
 
    // Validate: for drawn signatures, signatureImage is required
    if (signatureType === "draw" && !signatureImage) {
      return res.status(400).json({ message: "Signature image is required for drawn signatures" });
    }
 
    request.signerName    = signerName    || "";
    request.fontStyle     = fontStyle     || "";
    request.signatureType = signatureType || "";
    request.signatureImage = signatureImage || "";
    request.status    = "signed";
    request.signedAt  = new Date();
 
    await request.save();
 
    console.log("Request saved as signed. documentId:", request.documentId);
 
    // Generate signed PDF — wrapped separately so a PDF failure doesn't
    // roll back the "signed" status that was already saved
    try {
      const pdfResult = await generateSignedPdfForRequest(
        request.documentId,
        request
      );
      request.signedPdfUrl = pdfResult.downloadUrl;
      await request.save();
 
      await sendEmail(
        request.email,
        "Document Signed Successfully",
        `Your document has been signed.\n\nDownload PDF:\n\n${request.signedPdfUrl}`
      );
    } catch (pdfError) {
      console.error("PDF GENERATION ERROR (non-fatal):", pdfError);
      // Don't return 500 — the signing itself succeeded
    }
 
    try {
      await createAuditLog(request.documentId, request.email, "signed", req.ip);
    } catch (auditError) {
      console.error("AUDIT LOG ERROR (non-fatal):", auditError);
    }
 
    res.status(200).json({
      success: true,
      message: "Document signed successfully",
      signedPdfUrl: request.signedPdfUrl || null,
      request,
    });
  } catch (error) {
    console.error("MARK SIGNED ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
 
// ─── Reject Request ───────────────────────────────────────────────────────────
 
const rejectRequest = async (req, res) => {
  try {
    console.log("===== REJECT REQUEST =====");
    const { token } = req.params;
    const { reason } = req.body;
 
    console.log("Token:", token);
 
    const request = await SignatureRequest.findOne({ token });
 
    if (!request) {
      console.error("No request found for token:", token);
      return res.status(404).json({ message: "Invalid token" });
    }
 
    if (request.status === "rejected") {
      return res.status(400).json({ message: "Document already rejected" });
    }
 
    if (request.status === "signed") {
      return res.status(400).json({ message: "Document already signed and cannot be rejected" });
    }
 
    request.status = "rejected";
    request.reason = reason || "";
    await request.save();
 
    try {
      await createAuditLog(request.documentId, request.email, "rejected", req.ip, reason);
    } catch (auditError) {
      console.error("AUDIT LOG ERROR (non-fatal):", auditError);
    }
 
    res.status(200).json({
      message: "Request rejected successfully",
      request,
    });
  } catch (error) {
    console.error("REJECT REQUEST ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
 
// ─── Get All Requests ─────────────────────────────────────────────────────────
 
const getAllRequests = async (req, res) => {
  try {
    const requests = await SignatureRequest.find();
    res.json(requests);
  } catch (error) {
    console.error("GET ALL REQUESTS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
 
// ─── Self Sign ────────────────────────────────────────────────────────────────
 
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
 
    res.json({ success: true, request });
  } catch (error) {
    console.error("SELF SIGN ERROR:", error);
    res.status(500).json({ message: error.message });
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