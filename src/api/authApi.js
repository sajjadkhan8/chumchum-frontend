import { apiRequest } from "./client";

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

