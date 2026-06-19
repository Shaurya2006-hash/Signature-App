const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "pdfs",
  allowedFormats: ["pdf"],
  resource_type: "raw",
});

const upload = multer({
  storage,
});

module.exports = upload;