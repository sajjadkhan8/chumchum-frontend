import { apiClient } from '@/lib/api/client';
import { mapCreator } from '@/lib/api/mappers';
import type { Creator, CreatorFilters } from '@/types';

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
  category?: string;
  coverImageUrl?: string;
  website?: string;
  niche?: string;
  availabilityStatus?: string;
  isFiler?: boolean;
  responseTime?: string;
  minPrice?: number;
  maxPrice?: number;
  acceptsBarter?: boolean;
  acceptsHybridDeals?: boolean;
  minimumBudget?: number;
  preferredIndustries?: string;
  languages?: string[];
  categories?: string[];
  tiktokUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  rateCardReel?: number;
  rateCardStory?: number;
  rateCardPost?: number;
  rateCardVideo?: number;
}

export interface CreatorSocialAccountPayload {
  platform: string;
  username: string;
  profileUrl?: string;
  followers?: number;
  avgViews?: number;
  engagementRate?: number;
}

interface CreatorPreferencesPayload {
  acceptsBarter: boolean;
  acceptsHybridDeals: boolean;
  preferredIndustries: string;
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
      category: payload.category,
      cover_image_url: payload.coverImageUrl,
      website: payload.website,
      niche: payload.niche,
      availability_status: payload.availabilityStatus,
      response_time: payload.responseTime,
      min_price: payload.minPrice,
      max_price: payload.maxPrice,
      accepts_barter: payload.acceptsBarter,
      accepts_hybrid_deals: payload.acceptsHybridDeals,
      minimum_budget: payload.minimumBudget,
      preferred_industries: payload.preferredIndustries,
      languages: payload.languages,
      categories: payload.categories,
      tiktok_url: payload.tiktokUrl,
      instagram_url: payload.instagramUrl,
      youtube_url: payload.youtubeUrl,
      facebook_url: payload.facebookUrl,
    });

    return mapCreator(response as never);
  },

  async updateSocialAccounts(accounts: CreatorSocialAccountPayload[]): Promise<CreatorSocialAccountPayload[]> {
    const response = await apiClient.put<CreatorSocialAccountPayload[]>('/api/v1/creators/me/social-accounts', {
      accounts,
    });

    return Array.isArray(response) ? response : [];
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
    // Send a single city to the backend when exactly one is selected; otherwise let the
    // backend return unfiltered results and rely on client-side city filtering below.
    const backendCity = filters?.cities?.length === 1 ? filters.cities[0] : undefined;

    const payload = await apiClient.get<SearchResponse | unknown[]>('/api/v1/creators', {
      query: {
        search: filters?.search,
        city: backendCity,
        category: filters?.categories?.[0],
        platform: filters?.platforms?.[0]?.toLowerCase(),
        minFollowers: filters?.minFollowers,
        maxFollowers: filters?.maxFollowers,
        minRating: filters?.minRating,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        badgeLevel: filters?.badgeLevel === 'none' ? undefined : filters?.badgeLevel?.toUpperCase(),
        availabilityStatus: filters?.availabilityStatus,
        acceptsBarter: filters?.dealTypes?.includes('barter') ? true : undefined,
        sortBy: filters?.sortBy,
        limit: 50,
      },
      auth: false,
    });

    const raw = payload as SearchResponse;
    const backendTotal: number = (typeof raw?.total === 'number' ? raw.total : 0);
    let results = unwrapCreators(payload).map((creator) => mapCreator(creator as never));

    // Multi-city client-side filter (backend only handles single city)
    if ((filters?.cities?.length ?? 0) > 1) {
      results = results.filter((creator) => filters!.cities!.includes(creator.city));
    }

    if (filters?.dealTypes?.length) {
      results = results.filter((creator) => creator.dealTypes.some((type) => filters.dealTypes?.includes(type)));
    }

    if (filters?.barterTypes?.length) {
      results = results.filter((creator) => creator.barterTypes?.some((type) => filters.barterTypes?.includes(type)));
    }

    if (filters?.sortBy === 'budget_friendly') {
      results.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
    }

    if (filters?.sortBy === 'top_rated') {
      results.sort((a, b) => b.rating - a.rating);
    }

    if (filters?.sortBy === 'near_you') {
      results.sort((a, b) => a.city.localeCompare(b.city));
    }

    return { creators: results, total: backendTotal || results.length };
  },

  async getById(id: string): Promise<Creator | null> {
    const response = await apiClient.get<unknown>(`/api/v1/creators/${id}`, { auth: false });
    return response ? mapCreator(response as never) : null;
  },

  async getByUsername(username: string): Promise<Creator | null> {
    const { creators } = await this.getAll({ search: username });
    return creators.find((creator) => creator.username === username) || null;
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
  }): Promise<{ id: string; type: string; thumbnailUrl: string; mediaUrl: string; platform: string }> {
    const response = await apiClient.post<{ id: string; type: string; thumbnailUrl: string; mediaUrl: string; platform: string }>('/api/v1/creators/me/portfolio', item);
    return response;
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
