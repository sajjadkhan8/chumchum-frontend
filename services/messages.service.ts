import type { Conversation, Message, QuickDealOffer } from '@/types';
import { mockConversations, mockMessages, getConversationsByUserId, getMessagesByConversationId } from '@/data/messages';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const messagesService = {
  async getConversations(userId: string, role: 'creator' | 'brand'): Promise<Conversation[]> {
    await delay(500);
    return getConversationsByUserId(userId, role);
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    await delay(400);
    return getMessagesByConversationId(conversationId);
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: 'creator' | 'brand',
    content: string
  ): Promise<Message> {
    await delay(300);
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      senderType,
      content,
      type: 'text',
      isRead: false,
      createdAt: new Date(),
    };
    mockMessages.push(newMessage);
    
    // Update conversation
    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = newMessage;
      conv.updatedAt = new Date();
    }
    
    return newMessage;
  },

  async sendOffer(
    conversationId: string,
    senderId: string,
    senderType: 'creator' | 'brand',
    offer: QuickDealOffer
  ): Promise<Message> {
    await delay(400);
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      senderType,
      content: '',
      type: 'offer',
      offer,
      isRead: false,
      createdAt: new Date(),
    };
    mockMessages.push(newMessage);
    
    // Update conversation
    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = newMessage;
      conv.updatedAt = new Date();
    }
    
    return newMessage;
  },

  async markAsRead(conversationId: string): Promise<void> {
    await delay(200);
    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
    }
    mockMessages
      .filter((m) => m.conversationId === conversationId)
      .forEach((m) => {
        m.isRead = true;
      });
  },
};
