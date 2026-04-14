import { apiRequest } from "./client";

const toNumber = (value, fallback = 0) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const normalizeOrder = (order = {}) => ({
  id: order.id || order._id || order.orderId || "",
  packageId: order.package_id || order.packageId || order.package?.id || order.gigId || "",
  packageTitle: order.package_title || order.packageTitle || order.package?.title || order.title || "Package",
  packageImage: order.package_image || order.packageImage || order.image || order.package?.cover_image || "",
  pricing_type: order.pricing_type || order.pricingType || order.package?.pricing_type || "PAID",
  price: toNumber(order.price ?? order.amount ?? order.package?.price),
  currency: order.currency || order.package?.currency || "PKR",
  status: order.status || "CREATED",
  brandName: order.brand_name || order.brandName || order.brand?.company_name || order.buyerID?.username || "Brand",
  creatorName: order.creator_name || order.creatorName || order.creator?.user?.username || order.sellerID?.username || "Creator",
  brandId: order.brand_id || order.brandId || order.brand?.id || order.buyerID?.id || order.buyerID?._id || "",
  creatorId: order.creator_id || order.creatorId || order.creator?.id || order.sellerID?.id || order.sellerID?._id || "",
  created_at: order.created_at || order.createdAt || null,
});

const normalizeOrderCollection = (response) => {
  if (Array.isArray(response)) {
    return response.map(normalizeOrder);
  }

  if (Array.isArray(response?.content)) {
    return response.content.map(normalizeOrder);
  }

  if (Array.isArray(response?.data)) {
    return response.data.map(normalizeOrder);
  }

  return [];
};

export const getOrders = async () => {
  const response = await apiRequest({
    url: "/api/orders",
    method: "get",
  });

  return normalizeOrderCollection(response);
};

export const createOrder = async (payload) => {
  const response = await apiRequest({
    url: "/api/orders",
    method: "post",
    data: payload,
  });

  return normalizeOrder(response);
};

export const createPaymentIntent = (packageId) =>
  apiRequest({
    url: "/api/orders/payment-intents",
    method: "post",
    data: {
      packageId,
      package_id: packageId,
      gigId: packageId,
    },
  });

export const confirmOrderPayment = (paymentIntent) =>
  apiRequest({
    url: "/api/orders/payment-confirmation",
    method: "patch",
    data: {
      paymentIntent,
      payment_intent: paymentIntent,
    },
  });
