import { apiRequest } from "./client";

export const getReviewsByPackageId = (packageId) =>
  apiRequest({
    url: `/api/packages/${packageId}/reviews`,
    method: "get",
  });

export const createReview = ({ packageId, gigID, ...payload }) => {
  const resolvedPackageId = packageId || gigID;

  return apiRequest({
    url: `/api/packages/${resolvedPackageId}/reviews`,
    method: "post",
    data: payload,
  });
};

export const getReviewsByGigId = getReviewsByPackageId;
