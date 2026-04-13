import { apiRequest } from "./client";

export const getConversations = () =>
  apiRequest({
    url: "/api/conversations",
    method: "get",
  });

export const getConversationByParticipants = ({ sellerId, buyerId }) =>
  apiRequest({
    url: "/api/conversations/between",
    method: "get",
    params: {
      sellerId,
      buyerId,
    },
  });

export const createConversation = (payload) =>
  apiRequest({
    url: "/api/conversations",
    method: "post",
    data: payload,
  });

export const markConversationAsRead = (conversationId) =>
  apiRequest({
    url: `/api/conversations/${conversationId}/read`,
    method: "patch",
  });

