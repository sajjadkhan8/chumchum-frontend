import { apiRequest } from "./client";

export const createCreatorProfile = (payload) =>
  apiRequest({
    url: "/api/creators",
    method: "post",
    data: payload,
  });

export const getCreatorProfile = (userId) =>
  apiRequest({
    url: `/api/creators/user/${userId}`,
    method: "get",
  });

export const updateCreatorProfile = (creatorId, payload) =>
  apiRequest({
    url: `/api/creators/${creatorId}`,
    method: "put",
    data: payload,
  });

export const getCreators = () =>
  apiRequest({
    url: "/api/creators",
    method: "get",
  });

export const getCreatorById = (creatorId) =>
  apiRequest({
    url: `/api/creators/${creatorId}`,
    method: "get",
  });

