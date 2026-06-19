const Document = require("../models/Document");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload PDF
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "pdfs",
          resource_type: "raw",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    const document = await Document.create({
      originalName: req.file.originalname,
      fileName: result.public_id,
      filePath: result.secure_url,
      fileSize: result.bytes,

      // 🔥 USER LINK
      uploadedBy: req.user._id,
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getDocuments = async (req, res) => {
  try {
    const docs = await Document.find({
      uploadedBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const checkDocumentsExist = async (req, res) => {
  try {
    const count = await Document.countDocuments({
      uploadedBy: req.user._id,
    });

    res.json({
      exists: count > 0,
      count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};module.exports = {
  uploadDocument,
  getDocuments,
  checkDocumentsExist,
};