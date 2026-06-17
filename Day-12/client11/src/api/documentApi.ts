import axios from "axios";

const API_URL =
  "http://localhost:5000/api/docs";

export const getDocuments =
  async (token: string) => {
    const response =
      await axios.get(API_URL, {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      });

    return response.data;
  };