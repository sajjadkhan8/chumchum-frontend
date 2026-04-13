import { apiRequest } from "./client";

const buildGigFilters = (filters = {}) => {
  return Object.entries(filters).reduce((accumulator, [key, value]) => {
    if ([undefined, null, ""].includes(value)) {
      return accumulator;
    }

    return {
      ...accumulator,
      [key]: value,
    };
  }, {});
};

export const getGigs = (filters = {}) =>
  apiRequest({
    url: "/api/gigs",
    method: "get",
    params: buildGigFilters(filters),
  });

export const getGigById = (gigId) =>
  apiRequest({
    url: `/api/gigs/${gigId}`,
    method: "get",
  });

export const createGig = (payload) =>
  apiRequest({
    url: "/api/gigs",
    method: "post",
    data: payload,
  });

export const deleteGig = (gigId) =>
  apiRequest({
    url: `/api/gigs/${gigId}`,
    method: "delete",
  });

