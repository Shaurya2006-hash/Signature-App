import axios from "axios";

export const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const API = axios.create({
  baseURL: API_URL,
});

export default API;