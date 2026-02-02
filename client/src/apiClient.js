import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: `${apiBaseUrl}/api`,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("habitflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


