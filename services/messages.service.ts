import { apiClient } from '@/lib/api/client';
import { mapBrand, mapConversation, mapCreator, mapMessage } from '@/lib/api/mappers';
import type { Conversation, Message, QuickDealOffer } from '@/types';

interface BackendConversation {
  id: string;
  creatorId: string;
  brandId: string;
  readByCreator?: boolean;
  readByBrand?: boolean;
  unreadCountCreator?: number;
  unreadCountBrand?: number;
  lastMessage?: string;
  updatedAt?: string;
}

interface BackendMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  type: string;
  content?: string;
  attachmentUrl?: string;
  isRead?: boolean;
  offerDealType?: string;
  offerAmount?: number;
  offerBarterDetails?: string;
  offerStatus?: string;
  offerId?: string;
  createdAt?: string;
}

interface QuickDealRespondResponse {
  offerId: string;
  status: 'accepted' | 'rejected';
  orderId?: string;
}

const buildParticipantMaps = async (conversations: BackendConversation[]) => {
  const creatorIds = [...new Set(conversations.map((conversation) => conversation.creatorId))];
  const brandIds = [...new Set(conversations.map((conversation) => conversation.brandId))];

  const [creatorResponses, brandResponses] = await Promise.all([
    Promise.allSettled(creatorIds.map((id) => apiClient.get<unknown>(`/api/v1/creators/${id}`))),
    Promise.allSettled(brandIds.map((id) => apiClient.get<unknown>(`/api/v1/brands/${id}`))),
  ]);

  const creators = creatorIds.reduce<Record<string, ReturnType<typeof mapCreator>>>((acc, id, index) => {
    const value = creatorResponses[index];
    if (value.status === 'fulfilled') {
      acc[id] = mapCreator(value.value as never);
    }
    return acc;
  }, {});

  const brands = brandIds.reduce<Record<string, ReturnType<typeof mapBrand>>>((acc, id, index) => {
    const value = brandResponses[index];
    if (value.status === 'fulfilled') {
      acc[id] = mapBrand(value.value as never);
    }
    return acc;
  }, {});

  return { creators, brands };
};

export const messagesService = {
  async getConversations(_userId: string, role: 'creator' | 'brand'): Promise<Conversation[]> {
    const response = await apiClient.get<BackendConversation[]>('/api/v1/conversations');
    const conversations = Array.isArray(response) ? response : [];
    const { creators, brands } = await buildParticipantMaps(conversations);

    return conversations.map((conversation) => mapConversation(conversation, creators, brands, role));
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await apiClient.get<BackendMessage[]>(`/api/v1/conversations/${conversationId}/messages`);
    return (Array.isArray(response) ? response : []).map((message) => mapMessage(message));
  },

  async createConversation(creatorId: string): Promise<Conversation> {
    const response = await apiClient.post<BackendConversation>('/api/v1/conversations', { to: creatorId });
    const { creators, brands } = await buildParticipantMaps([response]);
    return mapConversation(response, creators, brands, 'brand');
  },

  async sendMessage(
    conversationId: string,
    _senderId: string,
    _senderType: 'creator' | 'brand',
    content: string,
  ): Promise<Message> {
    const response = await apiClient.post<BackendMessage>(`/api/v1/conversations/${conversationId}/messages`, {
      content,
    });

    return mapMessage(response);
  },

  async sendOffer(
    conversationId: string,
    _senderId: string,
    _senderType: 'creator' | 'brand',
    offer: QuickDealOffer,
  ): Promise<Message> {
    const response = await apiClient.post<BackendMessage>(`/api/v1/conversations/${conversationId}/messages/offer`, {
      content: offer.message,
      offerDealType: offer.dealType.toUpperCase(),
      offerAmount: offer.amount,
      offerBarterDetails: offer.barterDetails,
    });

    return mapMessage(response);
  },

  async sendAttachment(conversationId: string, file: File): Promise<Message> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<BackendMessage>(
      `/api/v1/conversations/${conversationId}/messages/attachment`,
      formData,
    );

    return mapMessage(response);
  },

  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.patch(`/api/v1/conversations/${conversationId}/read`);
  },

  async createQuickDeal(payload: {
    creatorId: string;
    dealType: 'paid' | 'barter' | 'hybrid';
    amount?: number;
    barterDetails?: string;
    barterCategory?: string;
    estimatedBarterValue?: number;
    creatorExpectation?: string;
    message: string;
  }): Promise<{ conversationId: string; messageId: string; offerId: string }> {
    return apiClient.post('/api/v1/quick-deals', {
      creatorId: payload.creatorId,
      dealType: payload.dealType.toUpperCase(),
      amount: payload.amount,
      barterDetails: payload.barterDetails,
      barterCategory: payload.barterCategory,
      estimatedBarterValue: payload.estimatedBarterValue,
      creatorExpectation: payload.creatorExpectation,
      message: payload.message,
    });
  },

  async respondToQuickDeal(offerId: string, action: 'accepted' | 'rejected'): Promise<QuickDealRespondResponse> {
    return apiClient.patch(`/api/v1/quick-deals/${offerId}/respond`, { action });
  },
};
