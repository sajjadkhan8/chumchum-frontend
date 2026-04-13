import { apiRequest } from "./client";

export const createBrandProfile = (payload) =>
  apiRequest({
    url: "/api/brands",
    method: "post",
    data: payload,
  });

export const getBrandProfile = (userId) =>
  apiRequest({
    url: `/api/brands/user/${userId}`,
    method: "get",
  });

export const updateBrandProfile = (brandId, payload) =>
  apiRequest({
    url: `/api/brands/${brandId}`,
    method: "put",
    data: payload,
  });

export const getBrands = () =>
  apiRequest({
    url: "/api/brands",
    method: "get",
  });

export const getBrandById = (brandId) =>
  apiRequest({
    url: `/api/brands/${brandId}`,
    method: "get",
  });

