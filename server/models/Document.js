const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number,

    // 🔥 IMPORTANT: USER OWNERSHIP
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);