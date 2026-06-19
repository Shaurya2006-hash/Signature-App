import API from "../config/api";

// ─────────────────────────────
// SIGNATURES
// ─────────────────────────────
export const getSignatures = async () => {
  const response = await API.get("/api/signatures");
  return response.data;
};

export const saveSignature = async (data: any) => {
  const response = await API.post("/api/signatures", data);
  return response.data;
};

// ─────────────────────────────
// GENERATE PDF (IMPORTANT FIX HERE)
// ─────────────────────────────
export const generatePdf = async (documentId: string) => {
  const response = await API.post(
    `/api/pdf/generate/${documentId}`,
    {},
    {
      responseType: "blob",
    }
  );

  return response.data;
};