const Signature = require(
  "../models/Signature"
);

const createSignature =
  async (req, res) => {
    try {
      const {
        fileId,
        signer,
        x,
        y,
      } = req.body;

      const signature =
        await Signature.create({
          fileId,
          signer,
          x,
          y,
        });

      res.status(201).json(
        signature
      );
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

const getSignatures =
  async (req, res) => {
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
  createSignature,
  getSignatures,
};