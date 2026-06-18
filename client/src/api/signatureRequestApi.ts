import API from "../config/api";
export const verifyToken =
  async (
    token: string
  ) => {
    const response =
      await API.get(
        `/api/signature-request/${token}`
      );

    return response.data;
  };