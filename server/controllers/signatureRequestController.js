const SignatureRequest = require("../models/SignatureRequest");

// CREATE REQUEST
const createSignatureRequest = async (req, res) => {
  try {
    const { email, documentId } = req.body;

    const request = await SignatureRequest.create({
      email,
      documentId,
      status: "pending",
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL REQUESTS
const getSignatureRequests = async (req, res) => {
  try {
    const requests = await SignatureRequest.find();

    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// SELF SIGN
const updateSelfSignStatus = async (req, res) => {
  try {
    const request = await SignatureRequest.findOneAndUpdate(
      {
        documentId: req.params.id,
      },
      {
        status: "signed",
      },
      {
        new: true,
      }
    );

    if (!request) {
      return res.status(404).json({
        message: "Signature request not found",
      });
    }

    res.json(request);
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
};