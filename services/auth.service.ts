import { apiClient } from '@/lib/api/client';
import { mapUser } from '@/lib/api/mappers';
import type { User, UserRole } from '@/types';

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
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

export interface MfaChallengeResponse {
  mfaRequired: true;
  challengeToken: string;
}

export type LoginResponse = AuthTokenResponse | MfaChallengeResponse;

export function isMfaChallenge(response: LoginResponse): response is MfaChallengeResponse {
  return 'mfaRequired' in response && (response as MfaChallengeResponse).mfaRequired === true;
}

export interface ForgotPasswordResponse {
  message: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password }, { auth: false });
  },

  async verifyMfa(challengeToken: string, totpCode: string): Promise<AuthTokenResponse> {
    return apiClient.post<AuthTokenResponse>('/api/v1/auth/mfa/verify', { challengeToken, totpCode }, { auth: false });
  },

  async sendOtp(phone: string): Promise<{ message: string; expiresIn: number }> {
    return apiClient.post('/api/v1/auth/send-otp', { phone }, { auth: false });
  },

  async verifyOtp(phone: string, otp: string): Promise<AuthTokenResponse> {
    return apiClient.post<AuthTokenResponse>('/api/v1/auth/verify-otp', { phone, otp }, { auth: false });
  },

  async signup(email: string, password: string, role: UserRole, name: string, affiliateCode?: string, termsAccepted?: boolean): Promise<AuthTokenResponse> {
    return apiClient.post<AuthTokenResponse>(
      '/api/v1/auth/register',
      {
        email,
        password,
        role: role.toUpperCase(),
        name,
        affiliateCode,
        termsAccepted: termsAccepted ?? false,
      },
      { auth: false },
    );
  },

  async google(idToken: string, role: UserRole, name?: string, affiliateCode?: string, termsAccepted?: boolean): Promise<AuthTokenResponse> {
    return apiClient.post<AuthTokenResponse>(
      '/api/v1/auth/google',
      {
        idToken,
        role: role.toUpperCase(),
        name,
        affiliateCode,
        termsAccepted: termsAccepted ?? false,
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
    await apiClient.post('/api/v1/auth/logout', null, { auth: false });
  },

  async me(): Promise<User> {
    const response = await apiClient.get<{ id: string; email?: string; emailVerified?: boolean; phone?: string; role?: string; name?: string; avatarUrl?: string; creatorProgramStatus?: User['creatorProgramStatus']; active?: boolean; createdAt?: string }>('/api/v1/users/me');
    return mapUser(response);
  },
};
