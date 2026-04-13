import { apiRequest } from "./client";

export const getOrders = () =>
  apiRequest({
    url: "/api/orders",
    method: "get",
  });

export const createPaymentIntent = (gigId) =>
  apiRequest({
    url: "/api/orders/payment-intents",
    method: "post",
    data: { gigId },
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

