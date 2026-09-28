import API from "../config/api";

// ==========================================
// Generate signed PDF
// ==========================================

export const generatePdf = async (
  documentId,
  token,
  signatureData
) => {
  const response =
    await API.post(
      "/api/pdf/generate",
      {
        documentId,
        ...signatureData,
      },
      {
        responseType: "blob",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
};