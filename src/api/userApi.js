import { apiRequest } from "./client";

export const getUsers = () =>
  apiRequest({
    url: "/api/users",
    method: "get",
  });

export const createUser = (payload) =>
  apiRequest({
    url: "/api/users",
    method: "post",
    data: payload,
  });

export const getUserById = (userId) =>
  apiRequest({
    url: `/api/users/${userId}`,
    method: "get",
  });

export const updateUser = (userId, payload) =>
  apiRequest({
    url: `/api/users/${userId}`,
    method: "put",
    data: payload,
  });

export const deleteUser = (userId) =>
  apiRequest({
    url: `/api/users/${userId}`,
    method: "delete",
  });
