import { apiRequest } from "./client";

export const getOrders = () =>
  apiRequest({
    url: "/api/orders",
    method: "get",
  });

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
