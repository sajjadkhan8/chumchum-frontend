import { apiClient } from '@/lib/api/client';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  createdAt: Date;
}

interface BackendNotification {
  id: string;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  createdAt?: string;
}

interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const toDate = (value?: string): Date => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const mapNotification = (input: BackendNotification): AppNotification => ({
  id: input.id,
  type: input.type,
  title: input.title,
  body: input.body,
  entityType: input.entityType,
  entityId: input.entityId,
  read: input.read,
  createdAt: toDate(input.createdAt),
});

export const notificationsService = {
  async list(page = 0, size = 20): Promise<{ content: AppNotification[]; totalElements: number; totalPages: number; last: boolean }> {
    const response = await apiClient.get<PagedResponse<BackendNotification>>('/api/v1/notifications', {
      query: { page, size },
    });
    return {
      content: (response.content || []).map(mapNotification),
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 1,
      last: response.last ?? true,
    };
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/api/v1/notifications/unread-count');
    return response.count ?? 0;
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch('/api/v1/notifications/read-all');
  },

  async markRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/api/v1/notifications/${notificationId}/read`);
  },
};

