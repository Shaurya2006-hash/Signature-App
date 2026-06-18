const nodemailer =
  require("nodemailer");

const { v4: uuidv4 } =
  require("uuid");

const SignatureRequest =
  require("../models/SignatureRequest");

const sendSignatureRequest =
  async (req, res) => {
    try {
      const {
        documentId,
        email,
      } = req.body;

      const token = uuidv4();

      await SignatureRequest.create({
        documentId,
        email,
        token,
      });

      const link =
        `http://localhost:5173/sign/${token}`;

      const transporter =
        nodemailer.createTransport({
          service: "gmail",

          auth: {
            user:
              process.env.EMAIL_USER,

            pass:
              process.env.EMAIL_PASS,
          },
        });

      await transporter.sendMail({
        from:
          process.env.EMAIL_USER,

        to: email,

        subject:
          "PDF Signature Request",

        html: `
          <h2>Please Sign Document</h2>

          <a href="${link}">
            Sign Document
          </a>
        `,
      });

      res.json({
        message:
          "Email sent successfully",
      });
    }  catch (error) {
  console.error("EMAIL ERROR:", error.message); // ADD THIS LINE
  res.status(500).json({
    message: error.message,
  });
}
  }
module.exports = {
  sendSignatureRequest,
};