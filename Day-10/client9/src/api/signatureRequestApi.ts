import axios from "axios";

const API =
  "http://localhost:5000/api/signature-request";

export const verifyToken =
  async (
    token: string
  ) => {
    const response =
      await axios.get(
        `${API}/${token}`
      );

    return response.data;
  };