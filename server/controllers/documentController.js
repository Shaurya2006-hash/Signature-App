const Document = require("../models/Document");
const cloudinary = require("../config/cloudinary");

const uploadDocument = async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "pdfs",
          resource_type: "raw",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    console.log(result);

    const document = await Document.create({
      originalName: req.file.originalname,

      fileName: result.public_id,

      filePath: result.secure_url,

      fileSize: result.bytes,

      uploadedBy: req.user._id,
    });

    res.status(201).json(document);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};