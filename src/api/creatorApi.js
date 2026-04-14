import { apiRequest } from "./client";

const normalizeCreator = (creator = {}) => ({
  ...creator,
  id: creator.id || creator._id || "",
  user: creator.user || creator.user_id || creator.userID || {},
});

const normalizeCreatorCollection = (response) => {
  if (Array.isArray(response)) return response.map(normalizeCreator);
  if (Array.isArray(response?.content)) return response.content.map(normalizeCreator);
  if (Array.isArray(response?.data)) return response.data.map(normalizeCreator);
  return [];
};

export const createCreatorProfile = (payload) =>
  apiRequest({
    url: "/api/creators",
    method: "post",
    data: payload,
  });

export const getCreatorProfile = async (userId) => {
  const response = await apiRequest({
    url: `/api/creators/user/${userId}`,
    method: "get",
  });

  return normalizeCreator(response);
};

export const updateCreatorProfile = (creatorId, payload) =>
  apiRequest({
    url: `/api/creators/${creatorId}`,
    method: "put",
    data: payload,
  });

export const getCreators = async () => {
  const response = await apiRequest({
    url: "/api/creators",
    method: "get",
  });

  return normalizeCreatorCollection(response);
};

export const getCreatorById = async (creatorId) => {
  const response = await apiRequest({
    url: `/api/creators/${creatorId}`,
    method: "get",
  });

  return normalizeCreator(response);
};

