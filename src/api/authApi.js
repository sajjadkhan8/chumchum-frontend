import { apiRequest } from "./client";
import { clearSession, resolveAuthPayload, setStoredToken, setStoredUser } from "./session";

export const loginUser = (credentials) =>
  apiRequest({
    url: "/api/auth/login",
    method: "post",
    data: credentials,
  });

export const registerUser = (payload) =>
  apiRequest({
    url: "/api/auth/register",
    method: "post",
    data: payload,
  });

export const getCurrentUser = () =>
  apiRequest({
    url: "/api/auth/me",
    method: "get",
  });

export const logoutUser = () =>
  apiRequest({
    url: "/api/auth/logout",
    method: "post",
  });

export const persistAuthSession = (response) => {
  const { user, token } = resolveAuthPayload(response);

  setStoredUser(user);
  setStoredToken(token);

  return { user, token };
};

export const clearAuthSession = () => {
  clearSession();
};

