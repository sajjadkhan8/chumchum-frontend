import { apiClient } from '@/lib/api/client';
import { mapCreator } from '@/lib/api/mappers';
import type { BarterCategory, CollaborationPreference, Creator, CreatorFilters } from '@/types';

interface SearchResponse {
  creators?: unknown[];
  content?: unknown[];
  total?: number;
}

interface CreatorProfileUpdatePayload {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  city?: string;
  avatarUrl?: string;
  bio?: string;
  coverImageUrl?: string;
  website?: string;
  availabilityStatus?: string;
  isFiler?: boolean;
  responseTime?: string;
  minPrice?: number;
  maxPrice?: number;
  minimumBudget?: number;
  languages?: string[];
  categories?: string[];
  rateCardReel?: number;
  rateCardStory?: number;
  rateCardPost?: number;
  rateCardVideo?: number;
  collaborationPreferences?: CollaborationPreference[];
  barterTypes?: BarterCategory[];
}

export interface CreatorSocialAccountPayload {
  platform: string;
  username: string;
  profileUrl?: string;
  followers?: number;
  avgViews?: number;
  engagementRate?: number;
  verifiedBy?: string;
}

interface CreatorPreferencesPayload {
  collaborationPreferences: CollaborationPreference[];
  minimumBudget?: number;
}

export interface CreatorPaymentSettingsPayload {
  stcPayNumber: string;
  madaCard: string;
  accountTitle: string;
  ibanOrAccount: string;
  applePayNumber: string;
  bankTransferIban: string;
}

export interface CreatorVerificationDocument {
  id: string;
  type: 'identity' | 'social_profile' | 'portfolio_sample' | string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
}

export interface CreatorVerificationEvent {
  id: string;
  eventType: string;
  details?: string;
  documentId?: string;
  createdAt: string;
}

const unwrapCreators = (payload: SearchResponse | unknown[]): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.creators)) return payload.creators;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const creatorsService = {
  async getMe(): Promise<Creator | null> {
    const response = await apiClient.get<unknown>('/api/v1/creators/me/profile');
    return response ? mapCreator(response as never) : null;
  },

  async updateMe(payload: CreatorProfileUpdatePayload): Promise<Creator> {
    const response = await apiClient.patch<unknown>('/api/v1/creators/me/profile', {
      name: payload.name,
      username: payload.username,
      email: payload.email,
      phone: payload.phone,
      city: payload.city,
      avatar_url: payload.avatarUrl,
      bio: payload.bio,
      cover_image_url: payload.coverImageUrl,
      website: payload.website,
      availability_status: payload.availabilityStatus,
      response_time: payload.responseTime,
      min_price: payload.minPrice,
      max_price: payload.maxPrice,
      minimum_budget: payload.minimumBudget,
      languages: payload.languages,
      categories: payload.categories,
rate_card_reel: payload.rateCardReel,
      rate_card_story: payload.rateCardStory,
      rate_card_post: payload.rateCardPost,
      rate_card_video: payload.rateCardVideo,
      collaboration_preferences: payload.collaborationPreferences,
      barter_types: payload.barterTypes,
    });

    return mapCreator(response as never);
  },

  async updateSocialAccounts(accounts: CreatorSocialAccountPayload[]): Promise<CreatorSocialAccountPayload[]> {
    const response = await apiClient.put<CreatorSocialAccountPayload[]>('/api/v1/creators/me/social-accounts', {
      accounts,
    });

    return Array.isArray(response) ? response : [];
  },

  async patchSocialAccount(platform: string, data: Omit<CreatorSocialAccountPayload, 'platform'>): Promise<void> {
    await apiClient.patch(`/api/v1/creators/me/social-accounts/${platform}`, data);
  },

  async deleteSocialAccount(platform: string): Promise<void> {
    await apiClient.delete(`/api/v1/creators/me/social-accounts/${encodeURIComponent(platform)}`);
  },

  async initiateOAuthConnect(platform: string): Promise<{ redirectUrl: string }> {
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/creator/social/oauth/callback`
      : '';
    return apiClient.get<{ redirectUrl: string }>(`/api/v1/oauth/${platform}/authorize`, {
      query: { redirect_uri: redirectUri },
    });
  },

  async completeSocialOAuthConnect(platform: string, code: string, state?: string): Promise<Creator> {
    const response = await apiClient.post<unknown>(`/api/v1/oauth/${platform}/callback`, { code, state });
    return mapCreator(response as never);
  },

  async getVerificationDocuments(): Promise<CreatorVerificationDocument[]> {
    return apiClient.get<CreatorVerificationDocument[]>('/api/v1/creators/me/verification-documents');
  },

  async getVerificationEvents(): Promise<CreatorVerificationEvent[]> {
    return apiClient.get<CreatorVerificationEvent[]>('/api/v1/creators/me/verification-events');
  },

  async uploadVerificationDocument(input: { type: string; fileName: string; fileUrl: string }): Promise<CreatorVerificationDocument> {
    return apiClient.post<CreatorVerificationDocument>('/api/v1/creators/me/verification-documents', input);
  },

  async submitVerificationForReview(): Promise<void> {
    await apiClient.post('/api/v1/creators/me/verification/submit', {});
  },

  async updatePreferences(payload: CreatorPreferencesPayload): Promise<Creator> {
    const response = await apiClient.patch<unknown>('/api/v1/creators/me/preferences', { ...payload });
    return mapCreator(response as never);
  },

  async getPaymentSettings(): Promise<CreatorPaymentSettingsPayload> {
    return apiClient.get<CreatorPaymentSettingsPayload>('/api/v1/creators/me/payment-settings');
  },

  async updatePaymentSettings(payload: CreatorPaymentSettingsPayload): Promise<void> {
    await apiClient.patch('/api/v1/creators/me/payment-settings', { ...payload });
  },

  async getAll(filters?: CreatorFilters): Promise<{ creators: Creator[]; total: number }> {
    // Map frontend badgeLevel ('rising_star') → backend enum name ('RISING_STAR')
    const badgeLevelParam =
      !filters?.badgeLevel || filters.badgeLevel === 'none'
        ? undefined
        : filters.badgeLevel.toUpperCase();

    // Map frontend availabilityStatus ('available') → backend enum name ('AVAILABLE')
    const availabilityParam = filters?.availabilityStatus?.toUpperCase();

    const payload = await apiClient.get<SearchResponse | unknown[]>('/api/v1/creators', {
      query: {
        search: filters?.search,
        cities: filters?.cities?.length ? filters.cities : undefined,
        categories: filters?.categories,
        languages: filters?.languages,
        platform: filters?.platforms?.[0]?.toLowerCase(),
        minFollowers: filters?.minFollowers,
        maxFollowers: filters?.maxFollowers,
        minRating: filters?.minRating,
        minReviews: filters?.minReviews,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        badgeLevel: badgeLevelParam,
        availabilityStatus: availabilityParam,
        collaborationPreferences: filters?.collaborationPreferences?.length ? filters.collaborationPreferences : undefined,
        // Boolean toggles: send only when explicitly true so they don't over-filter when unset/false
        ambassadorOnly: filters?.ambassadorOnly ? true : undefined,
        isTrending: filters?.isTrending ? true : undefined,
        isFastResponder: filters?.isFastResponder ? true : undefined,
        minEngagementRate: filters?.minEngagementRate,
        minCompletionRate: filters?.minCompletionRate,
        maxRateCardReel: filters?.maxRateCardReel,
        maxRateCardStory: filters?.maxRateCardStory,
        maxRateCardPost: filters?.maxRateCardPost,
        maxRateCardVideo: filters?.maxRateCardVideo,
        sortBy: filters?.sortBy,
        page: filters?.page ?? 0,
        limit: 100,
      },
      auth: false,
    });

    const raw = payload as SearchResponse;
    const backendTotal: number = typeof raw?.total === 'number' ? raw.total : 0;
    let results = unwrapCreators(payload).map((creator) => mapCreator(creator as never));

    // barterTypes is still client-side; collaboration preference filtering is backend-backed.
    if (filters?.barterTypes?.length) {
      results = results.filter((creator) => creator.barterTypes?.some((type) => filters.barterTypes?.includes(type)));
    }

    // by_city sort stays client-side: sort alphabetically by city name
    if (filters?.sortBy === 'by_city') {
      results.sort((a, b) => (a.city ?? '').localeCompare(b.city ?? ''));
    }

    return { creators: results, total: backendTotal || results.length };
  },

  async getById(id: string): Promise<Creator | null> {
    const response = await apiClient.get<unknown>(`/api/v1/creators/${id}`, { auth: false });
    return response ? mapCreator(response as never) : null;
  },

  async getByUsername(username: string): Promise<Creator | null> {
    try {
      const response = await apiClient.get<unknown>(`/api/v1/creators/by-username/${encodeURIComponent(username)}`, { auth: false });
      return response ? mapCreator(response as never) : null;
    } catch {
      return null;
    }
  },

  async getByIdentifier(identifier: string): Promise<Creator | null> {
    return isUuid(identifier) ? this.getById(identifier) : this.getByUsername(identifier);
  },

  async getTrending(limit = 6): Promise<Creator[]> {
    const response = await apiClient.get<SearchResponse | unknown[]>('/api/v1/creators/trending', {
      query: { limit },
      auth: false,
    });

    return unwrapCreators(response).map((creator) => mapCreator(creator as never));
  },

  async getBarterFriendly(limit = 6): Promise<Creator[]> {
    const response = await apiClient.get<SearchResponse | unknown[]>('/api/v1/creators/barter-friendly', {
      query: { limit },
      auth: false,
    });

    return unwrapCreators(response).map((creator) => mapCreator(creator as never));
  },

  async getFastResponders(limit = 6): Promise<Creator[]> {
    const response = await apiClient.get<SearchResponse | unknown[]>('/api/v1/creators/fast-responders', {
      query: { limit },
      auth: false,
    });

    return unwrapCreators(response).map((creator) => mapCreator(creator as never));
  },

  async getRisingStars(limit = 6): Promise<Creator[]> {
    const response = await apiClient.get<SearchResponse | unknown[]>('/api/v1/creators/rising-stars', {
      query: { limit },
      auth: false,
    });

    return unwrapCreators(response).map((creator) => mapCreator(creator as never));
  },

  async getVerified(limit = 6): Promise<Creator[]> {
    const response = await apiClient.get<SearchResponse | unknown[]>('/api/v1/creators/verified', {
      query: { limit },
      auth: false,
    });

    return unwrapCreators(response).map((creator) => mapCreator(creator as never));
  },

  async addPortfolioItem(item: {
    type: 'image' | 'video';
    thumbnailUrl: string;
    mediaUrl: string;
    platform: string;
    views?: number;
    likes?: number;
  }): Promise<{ id: string; type: string; thumbnailUrl: string; mediaUrl: string; platform: string }> {
    const response = await apiClient.post<{ id: string; type: string; thumbnailUrl: string; mediaUrl: string; platform: string }>('/api/v1/creators/me/portfolio', item);
    return response;
  },

  async reorderPortfolio(ids: string[]): Promise<void> {
    await apiClient.put('/api/v1/creators/me/portfolio/reorder', { ids });
  },

  async deletePortfolioItem(itemId: string): Promise<void> {
    await apiClient.delete(`/api/v1/creators/me/portfolio/${itemId}`);
  },

  async getByCity(city: string, limit = 6): Promise<Creator[]> {
    const response = await apiClient.get<SearchResponse | unknown[]>('/api/v1/creators/by-city', {
      query: { city, limit },
      auth: false,
    });

    return unwrapCreators(response).map((creator) => mapCreator(creator as never));
  },
};
