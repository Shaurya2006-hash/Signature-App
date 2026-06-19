const Document = require("../models/Document");

const uploadDocument = async (req, res) => {
  try {
    console.log("========== FILE DATA ==========");
    console.log(req.file);
    console.log("================================");

    const document = await Document.create({
      originalName: req.file.originalname,

      // Cloudinary public id
      fileName: req.file.filename || req.file.public_id,

      // Cloudinary URL
      filePath: req.file.path,

      fileSize: req.file.size || 0,

      uploadedBy: req.user?._id,
    });

    res.status(201).json(document);
  } catch (error) {
    console.log("ERROR:");
    console.log(error);

    if (error.errors) {
      console.log(error.errors);
    }

    res.status(500).json({
      message: error.message,
    });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      uploadedBy: req.user._id,
    });

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
};