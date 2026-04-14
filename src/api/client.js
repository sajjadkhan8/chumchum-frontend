import axios from "axios";
import { logApiError, normalizeApiError } from "./errorUtils";
import { clearSession, getStoredToken } from "./session";

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
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(normalizeApiError(error))
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession();
    }

    const normalizedError = logApiError(error);
    return Promise.reject(normalizedError);
  }
);

export const apiRequest = async (config) => {
  const response = await apiClient.request(config);
  return response.data;
};

export default apiClient;

