import { apiRequest } from "./client";

export const getMessages = (conversationId) =>
  apiRequest({
	url: `/api/conversations/${conversationId}/messages`,
	method: "get",
  });

export const sendMessage = ({ conversationID, ...payload }) =>
  apiRequest({
	url: `/api/conversations/${conversationID}/messages`,
	method: "post",
	data: payload,
  });

