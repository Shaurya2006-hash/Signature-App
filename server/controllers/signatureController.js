const Signature = require("../models/Signature");

const saveSignature = async (req, res) => {
  try {
   const {
  fileId,
  signer,
  signerName,
  fontStyle,
  signatureImage,
  x,
  y,
  status,
} = req.body;

    const signature =
      await Signature.findOneAndUpdate(
        {
          fileId
        },
        {
  fileId,
  signer,
  signerName,
  fontStyle,
  signatureImage,
  x,
  y,
  status,
},
        {
          new: true,
          upsert: true,
        }
      );

    res.status(200).json(signature);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getSignatures = async (
  req,
  res
) => {
  try {
    const signatures =
      await Signature.find();

    res.json(signatures);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  saveSignature,
  getSignatures,
};