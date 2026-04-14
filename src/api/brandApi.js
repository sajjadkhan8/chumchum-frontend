import { apiRequest } from "./client";

const normalizeBrand = (brand = {}) => ({
  ...brand,
  id: brand.id || brand._id || "",
  user: brand.user || brand.user_id || brand.userID || {},
});

const normalizeBrandCollection = (response) => {
  if (Array.isArray(response)) return response.map(normalizeBrand);
  if (Array.isArray(response?.content)) return response.content.map(normalizeBrand);
  if (Array.isArray(response?.data)) return response.data.map(normalizeBrand);
  return [];
};

export const createBrandProfile = (payload) =>
  apiRequest({
    url: "/api/brands",
    method: "post",
    data: payload,
  });

export const getBrandProfile = async (userId) => {
  const response = await apiRequest({
    url: `/api/brands/user/${userId}`,
    method: "get",
  });

  return normalizeBrand(response);
};

export const updateBrandProfile = (brandId, payload) =>
  apiRequest({
    url: `/api/brands/${brandId}`,
    method: "put",
    data: payload,
  });

export const getBrands = async () => {
  const response = await apiRequest({
    url: "/api/brands",
    method: "get",
  });

  return normalizeBrandCollection(response);
};

export const getBrandById = async (brandId) => {
  const response = await apiRequest({
    url: `/api/brands/${brandId}`,
    method: "get",
  });

  return normalizeBrand(response);
};

