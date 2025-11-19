import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export const login = (data: { username: string; password: string }) => {
  return api.post("/api/token/", data);
};

export default api;
