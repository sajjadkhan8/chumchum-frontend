const USER_STORAGE_KEY = "user";
const TOKEN_STORAGE_KEY = "token";

const isBrowser = typeof window !== "undefined";

const safeParse = (value) => {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

export const getStoredUser = () => {
  if (!isBrowser) return null;
  return safeParse(localStorage.getItem(USER_STORAGE_KEY));
};

export const setStoredUser = (user) => {
  if (!isBrowser) return;

  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const getStoredToken = () => {
  if (!isBrowser) return "";
  return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
};

export const setStoredToken = (token) => {
  if (!isBrowser) return;

  if (!token) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearSession = () => {
  if (!isBrowser) return;
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const resolveAuthPayload = (response = {}) => {
  const user =
    response.user || response.data?.user || response.data || response.profile || null;
  const token =
    response.token ||
    response.accessToken ||
    response.jwt ||
    response.data?.token ||
    response.data?.accessToken ||
    "";

  return {
    user,
    token,
  };
};

export const getDashboardPathByRole = (role) => {
  if (role === "CREATOR") return "/creator/dashboard";
  if (role === "ADMIN") return "/admin/dashboard";
  return "/brand/dashboard";
};

