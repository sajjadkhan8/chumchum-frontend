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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  confirmPassword: string;
}

export const usersService = {
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return apiClient.get<NotificationPreferences>('/api/v1/users/me/notification-preferences');
  },

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    return apiClient.put<NotificationPreferences>('/api/v1/users/me/notification-preferences', { ...preferences });
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await apiClient.patch('/api/v1/users/me/password', payload);
  },

  async deleteAccount(payload: DeleteAccountRequest): Promise<void> {
    await apiClient.request('/api/v1/users/me', {
      method: 'DELETE',
      body: payload,
    });
  },
};
