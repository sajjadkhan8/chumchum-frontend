import { apiClient } from '@/lib/api/client';

export interface NotificationPreferences {
  newOrders: boolean;
  messages: boolean;
  reviews: boolean;
  marketing: boolean;
  weeklyDigest: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export const usersService = {
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return apiClient.get<NotificationPreferences>('/api/v1/users/me/notification-preferences');
  },

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    return apiClient.put<NotificationPreferences>('/api/v1/users/me/notification-preferences', { ...preferences });
  },
};
