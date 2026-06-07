import { apiClient } from '@/lib/api/client';
import { mapUser } from '@/lib/api/mappers';
import type { User, UserRole } from '@/types';

interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email?: string;
    emailVerified?: boolean;
    phone?: string;
    role?: string;
    name?: string;
    avatarUrl?: string;
    creatorProgramStatus?: User['creatorProgramStatus'];
    active?: boolean;
    createdAt?: string;
  };
}

export interface ForgotPasswordResponse {
  message: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthTokenResponse> {
    return apiClient.post<AuthTokenResponse>('/api/v1/auth/login', { email, password }, { auth: false });
  },

  async sendOtp(phone: string): Promise<{ message: string; expiresIn: number }> {
    return apiClient.post('/api/v1/auth/send-otp', { phone }, { auth: false });
  },

  async verifyOtp(phone: string, otp: string): Promise<AuthTokenResponse> {
    return apiClient.post<AuthTokenResponse>('/api/v1/auth/verify-otp', { phone, otp }, { auth: false });
  },

  async signup(email: string, password: string, role: UserRole, name: string): Promise<AuthTokenResponse> {
    return apiClient.post<AuthTokenResponse>(
      '/api/v1/auth/register',
      {
        email,
        password,
        role: role.toUpperCase(),
        name,
      },
      { auth: false },
    );
  },

  async google(idToken: string, role: UserRole, name?: string): Promise<AuthTokenResponse> {
    return apiClient.post<AuthTokenResponse>(
      '/api/v1/auth/google',
      {
        idToken,
        role: role.toUpperCase(),
        name,
      },
      { auth: false },
    );
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>('/api/v1/auth/forgot-password', { email }, { auth: false });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/v1/auth/reset-password', { token, newPassword }, { auth: false });
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/v1/auth/logout', null);
  },

  async me(): Promise<User> {
    const response = await apiClient.get<{ id: string; email?: string; emailVerified?: boolean; phone?: string; role?: string; name?: string; avatarUrl?: string; creatorProgramStatus?: User['creatorProgramStatus']; active?: boolean; createdAt?: string }>('/api/v1/users/me');
    return mapUser(response);
  },
};
