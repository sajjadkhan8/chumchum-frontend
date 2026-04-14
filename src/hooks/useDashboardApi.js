import { useQuery } from "@tanstack/react-query";
import {
  getBrands,
  getConversations,
  getCreators,
  getMyPackages,
  getOrders,
  getPackages,
  getUsers,
} from "../api";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

export const usePackages = (queryKey = ["packages"]) =>
  useQuery({
    queryKey,
    queryFn: () => getPackages(),
  });

export const useMyPackages = () =>
  useQuery({
    queryKey: ["packages", "my"],
    queryFn: () => getMyPackages(),
  });

export const useOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  });

export const useCreators = () =>
  useQuery({
    queryKey: ["creators"],
    queryFn: () => getCreators(),
  });

export const useConversations = () =>
  useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await getConversations();
      return toArray(response);
    },
  });

export const useAdminCollections = () =>
  useQuery({
    queryKey: ["admin", "collections"],
    queryFn: async () => {
      const [users, creators, brands, packages, orders] = await Promise.all([
        getUsers(),
        getCreators(),
        getBrands(),
        getPackages(),
        getOrders(),
      ]);

      return { users, creators, brands, packages, orders };
    },
  });

