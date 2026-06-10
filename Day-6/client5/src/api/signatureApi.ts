import axios from "axios";

const API_URL =
  "http://localhost:5000/api/signatures";

export const getSignatures =
  async () => {
    const response =
      await axios.get(API_URL);

    return response.data;
  };

export const saveSignature =
  async (data: any) => {
    const response =
      await axios.post(
        API_URL,
        data
      );

    return response.data;
  };