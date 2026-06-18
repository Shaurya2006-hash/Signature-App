import API from "../config/api";

export const getDocuments =
  async (token: string) => {
    const response =
     await API.get("/api/documents", {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    return response.data;
  };