const SignatureRequest = require("../models/SignatureRequest");
const Document = require("../models/Document");

const sendEmail = require("../utils/sendEmail");

const { v4: uuidv4 } = require("uuid");

// ====================
// CREATE REQUEST
// ====================

const createSignatureRequest = async (
  req,
  res
) => {
  try {
    const { email, documentId } = req.body;

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

      <p>Please review document.</p>

      <a href="${signingLink}">
        Open Document
      </a>
      `
    );

    res.status(201).json(request);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ====================
// GET ALL REQUESTS
// ====================

const getSignatureRequests = async (
  req,
  res
) => {
  try {
    const requests =
      await SignatureRequest.find();

    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ====================
// SELF SIGN
// ====================

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
        },
        {
          returnDocument: "after",
        }
      );

    res.json(request);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ====================
// GET BY TOKEN
// ====================

const getRequestByToken = async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({
      token: req.params.token,
    }).populate("documentId");

    if (!request) {
      return res.status(404).json({
        message: "Invalid Link",
      });
    }

    return res.json({
      request,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ====================
// SIGN DOCUMENT
// ====================

const signDocument = async (
  req,
  res
) => {
  try {
    const request =
      await SignatureRequest.findOne({
        token: req.params.token,
      });

    if (!request) {
      return res
        .status(404)
        .json({
          message: "Invalid Request",
        });
    }

    request.status = "signed";
    request.signedAt = new Date();

    await request.save();

    await sendEmail(
      process.env.OWNER_EMAIL,
      "Document Signed",
      `
      <h2>Document Signed</h2>

      <p>
        ${request.email}
        signed the document.
      </p>
      `
    );

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ====================
// REJECT DOCUMENT
// ====================

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
      return res
        .status(404)
        .json({
          message: "Invalid Request",
        });
    }

    request.status = "rejected";

    request.reason =
      req.body.reason || "";

    await request.save();

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
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
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