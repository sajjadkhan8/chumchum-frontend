import { apiRequest } from "./client";

export const getReviewsByGigId = (gigId) =>
  apiRequest({
    url: `/api/gigs/${gigId}/reviews`,
    method: "get",
  });

export const createReview = ({ gigID, ...payload }) =>
  apiRequest({
    url: `/api/gigs/${gigID}/reviews`,
    method: "post",
    data: payload,
  });

