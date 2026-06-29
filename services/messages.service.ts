import { apiClient } from '@/lib/api/client';
import { mapBrand, mapConversation, mapCreator, mapMessage } from '@/lib/api/mappers';
import { uploadsService } from '@/services/uploads.service';
import type { Conversation, Message } from '@/types';

interface BackendConversation {
  id: string;
  creatorId: string;
  brandId: string;
  contextType?: string;
  contextId?: string;
  contextLabel?: string;
  contextTitle?: string;
  contextStatus?: string;
  contextAmount?: number;
  contextDeadlineDate?: string;
  readByCreator?: boolean;
  readByBrand?: boolean;
  unreadCountCreator?: number;
  unreadCountBrand?: number;
  lastMessage?: string;
  updatedAt?: string;
  creatorName?: string;
  creatorAvatarUrl?: string;
  creatorOnline?: boolean;
  creatorLastSeenAt?: string;
  brandName?: string;
  brandLogoUrl?: string;
  brandOnline?: boolean;
  brandLastSeenAt?: string;
  blockedByMe?: boolean;
  blockedByThem?: boolean;
}

interface BackendMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  type: string;
  content?: string;
  attachmentUrl?: string;
  attachmentOriginalName?: string;
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

const buildParticipantMapsFromEmbedded = (
  conversations: BackendConversation[],
): { creators: Record<string, ReturnType<typeof mapCreator>>; brands: Record<string, ReturnType<typeof mapBrand>> } => {
  const creators: Record<string, ReturnType<typeof mapCreator>> = {};
  const brands: Record<string, ReturnType<typeof mapBrand>> = {};
  for (const c of conversations) {
    if (c.creatorName) {
      creators[c.creatorId] = mapCreator({
        id: c.creatorId,
        name: c.creatorName,
        avatar_url: c.creatorAvatarUrl,
      } as never);
    }
    if (c.brandName) {
      brands[c.brandId] = mapBrand({
        id: c.brandId,
        name: c.brandName,
        logo_url: c.brandLogoUrl,
      } as never);
    }
  }
  return { creators, brands };
};

const buildParticipantMaps = async (conversations: BackendConversation[]) => {
  const missingCreatorIds = [...new Set(
    conversations.filter((c) => !c.creatorName).map((c) => c.creatorId),
  )];
  const missingBrandIds = [...new Set(
    conversations.filter((c) => !c.brandName).map((c) => c.brandId),
  )];

  const { creators, brands } = buildParticipantMapsFromEmbedded(conversations);

  if (missingCreatorIds.length === 0 && missingBrandIds.length === 0) {
    return { creators, brands };
  }

  const [creatorResponses, brandResponses] = await Promise.all([
    Promise.allSettled(missingCreatorIds.map((id) => apiClient.get<unknown>(`/api/v1/creators/${id}`))),
    Promise.allSettled(missingBrandIds.map((id) => apiClient.get<unknown>(`/api/v1/brands/${id}`))),
  ]);

  missingCreatorIds.forEach((id, index) => {
    const value = creatorResponses[index];
    if (value.status === 'fulfilled') creators[id] = mapCreator(value.value as never);
  });
  missingBrandIds.forEach((id, index) => {
    const value = brandResponses[index];
    if (value.status === 'fulfilled') brands[id] = mapBrand(value.value as never);
  });

  return { creators, brands };
};

export const messagesService = {
  async getConversations(
    _userId: string,
    role: 'creator' | 'brand',
    page = 0,
    limit = 50,
  ): Promise<{ items: Conversation[]; total: number; page: number; limit: number }> {
    const payload = await apiClient.get<{ items: unknown[]; total: number; page: number; limit: number }>(
      '/api/v1/conversations',
      { query: { page, limit } },
    );
    const rawItems: BackendConversation[] = Array.isArray(payload.items) ? (payload.items as BackendConversation[]) : [];
    const { creators, brands } = await buildParticipantMaps(rawItems);
    return {
      items: rawItems.map((conversation) => mapConversation(conversation, creators, brands, role)),
      total: payload.total ?? 0,
      page: payload.page ?? page,
      limit: payload.limit ?? limit,
    };
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await apiClient.get<BackendMessage[]>(`/api/v1/conversations/${conversationId}/messages`);
    return (Array.isArray(response) ? response : []).map((message) => mapMessage(message));
  },

  async createConversationWith(
    toUserId: string,
    role: 'creator' | 'brand',
    context?: { contextType?: Conversation['contextType']; contextId?: string },
  ): Promise<Conversation> {
    const response = await apiClient.post<BackendConversation>('/api/v1/conversations', {
      to: toUserId,
      contextType: context?.contextType,
      contextId: context?.contextId,
    });
    const { creators, brands } = await buildParticipantMaps([response]);
    return mapConversation(response, creators, brands, role);
  },

  async createConversation(creatorId: string): Promise<Conversation> {
    return this.createConversationWith(creatorId, 'brand');
  },

  async openCreatorConversation(
    creatorId: string,
    conversations: Conversation[] = [],
  ): Promise<Conversation> {
    const existing = conversations.find((conversation) =>
      conversation.creatorId === creatorId && conversation.contextType === 'general'
    );
    return existing || this.createConversation(creatorId);
  },

  async openBrandConversation(
    brandId: string,
    conversations: Conversation[] = [],
  ): Promise<Conversation> {
    const existing = conversations.find((conversation) =>
      conversation.brandId === brandId && conversation.contextType === 'general'
    );
    return existing || this.createConversationWith(brandId, 'creator');
  },

  async openOrderConversation(
    orderId: string,
    role: 'creator' | 'brand',
    conversations: Conversation[] = [],
  ): Promise<Conversation> {
    const existing = conversations.find((conversation) =>
      conversation.contextType === 'order' && conversation.contextId === orderId
    );
    if (existing) return existing;
    const response = await apiClient.post<BackendConversation>('/api/v1/conversations', {
      contextType: 'order',
      contextId: orderId,
    });
    const { creators, brands } = await buildParticipantMaps([response]);
    return mapConversation(response, creators, brands, role);
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

  async sendAttachment(conversationId: string, file: File): Promise<Message> {
    await uploadsService.validateFile('message-attachment', file);

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

  async clearChat(conversationId: string): Promise<void> {
    await apiClient.post(`/api/v1/conversations/${conversationId}/clear`, {});
  },

  async blockUser(conversationId: string): Promise<void> {
    await apiClient.post(`/api/v1/conversations/${conversationId}/block`, {});
  },

  async unblockUser(conversationId: string): Promise<void> {
    await apiClient.post(`/api/v1/conversations/${conversationId}/unblock`, {});
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
    platform?: string;
    deliveryDays?: number;
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
      platform: payload.platform?.toUpperCase(),
      deliveryDays: payload.deliveryDays,
    });
  },

  async respondToQuickDeal(offerId: string, action: 'accepted' | 'rejected'): Promise<QuickDealRespondResponse> {
    return apiClient.patch(`/api/v1/quick-deals/${offerId}/respond`, { action });
  },
};
