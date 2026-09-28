const { Resend } = require("resend");

const resend = new Resend(
  process.env.RESEND_API_KEY
);

// =====================================================
// Normal email
// =====================================================

const sendEmail = async (
  to,
  subject,
  html
) => {
  return await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject,
    html,
  });
};

// =====================================================
// Email with signed PDF attachment
// =====================================================

const sendEmailWithAttachment =
  async (
    to,
    subject,
    html,
    pdfBuffer,
    fileName = "signed.pdf"
  ) => {
    return await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html,

      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
        },
      ],
    });
  };

module.exports = {
  sendEmail,
  sendEmailWithAttachment,
};