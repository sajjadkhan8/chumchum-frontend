import axios from "axios";
import { logApiError, normalizeApiError } from "./errorUtils";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(normalizeApiError(error))
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = logApiError(error);
    return Promise.reject(normalizedError);
  }
);

export const apiRequest = async (config) => {
  const response = await apiClient.request(config);
  return response.data;
};

export default apiClient;

