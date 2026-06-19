import API from "../config/api";

// Generate signed PDF
export const generatePdf = async (documentId, token) => {
  const response = await API.post(
    `/api/pdf/generate/${documentId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};