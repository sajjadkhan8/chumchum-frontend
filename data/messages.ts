import type { Conversation, Message } from '@/types';
import { mockCreators } from './creators';
import { mockBrands } from './brands';

export const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    creatorId: '1',
    creator: mockCreators[0],
    brandId: 'b1',
    brand: mockBrands[0],
    lastMessage: {
      id: 'm1',
      conversationId: 'conv1',
      senderId: 'b1',
      senderType: 'brand',
      content: 'Hi Ali! We loved your recent food reviews. Would you be interested in a collaboration?',
      type: 'text',
      isRead: false,
      createdAt: new Date('2024-03-15T10:30:00'),
    },
    unreadCount: 2,
    updatedAt: new Date('2024-03-15T10:30:00'),
  },
  {
    id: 'conv2',
    creatorId: '1',
    creator: mockCreators[0],
    brandId: 'b3',
    brand: mockBrands[2],
    lastMessage: {
      id: 'm2',
      conversationId: 'conv2',
      senderId: '1',
      senderType: 'creator',
      content: 'Thank you for the offer! I\'d love to discuss the details further.',
      type: 'text',
      isRead: true,
      createdAt: new Date('2024-03-14T16:45:00'),
    },
    unreadCount: 0,
    updatedAt: new Date('2024-03-14T16:45:00'),
  },
  {
    id: 'conv3',
    creatorId: '2',
    creator: mockCreators[1],
    brandId: 'b2',
    brand: mockBrands[1],
    lastMessage: {
      id: 'm3',
      conversationId: 'conv3',
      senderId: 'b2',
      senderType: 'brand',
      content: 'We\'d like to send you our new collection for a barter deal. What do you think?',
      type: 'text',
      isRead: false,
      createdAt: new Date('2024-03-15T09:15:00'),
    },
    unreadCount: 1,
    updatedAt: new Date('2024-03-15T09:15:00'),
  },
];

export const mockMessages: Message[] = [
  {
    id: 'm1-1',
    conversationId: 'conv1',
    senderId: 'b1',
    senderType: 'brand',
    content: 'Assalam o Alaikum Ali! We\'ve been following your content for a while now.',
    type: 'text',
    isRead: true,
    createdAt: new Date('2024-03-15T09:00:00'),
  },
  {
    id: 'm1-2',
    conversationId: 'conv1',
    senderId: 'b1',
    senderType: 'brand',
    content: 'Your food reviews are amazing! The way you capture the essence of each dish is incredible.',
    type: 'text',
    isRead: true,
    createdAt: new Date('2024-03-15T09:01:00'),
  },
  {
    id: 'm1-3',
    conversationId: 'conv1',
    senderId: '1',
    senderType: 'creator',
    content: 'Walaikum Assalam! Thank you so much for the kind words. I really appreciate it!',
    type: 'text',
    isRead: true,
    createdAt: new Date('2024-03-15T09:15:00'),
  },
  {
    id: 'm1-4',
    conversationId: 'conv1',
    senderId: 'b1',
    senderType: 'brand',
    content: 'We\'d love to collaborate with you. Here\'s our offer:',
    type: 'text',
    isRead: true,
    createdAt: new Date('2024-03-15T10:00:00'),
  },
  {
    id: 'm1-5',
    conversationId: 'conv1',
    senderId: 'b1',
    senderType: 'brand',
    content: '',
    type: 'offer',
    offer: {
      dealType: 'hybrid',
      amount: 35000,
      barterDetails: 'Free meals for 3 months (worth PKR 45,000)',
      message: 'Monthly food reviews featuring our partner restaurants',
      status: 'pending',
    },
    isRead: false,
    createdAt: new Date('2024-03-15T10:30:00'),
  },
];

export const getConversationsByUserId = (userId: string, role: 'creator' | 'brand'): Conversation[] => {
  if (role === 'creator') {
    return mockConversations.filter((conv) => conv.creatorId === userId);
  }
  return mockConversations.filter((conv) => conv.brandId === userId);
};

export const getMessagesByConversationId = (conversationId: string): Message[] => {
  return mockMessages.filter((msg) => msg.conversationId === conversationId);
};
