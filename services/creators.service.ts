import { apiClient } from '@/lib/api/client';
import { mapCreator } from '@/lib/api/mappers';
import type { Creator, CreatorFilters } from '@/types';

interface SearchResponse {
  creators?: unknown[];
  content?: unknown[];
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
}

export interface CreatorSocialAccountPayload {
  platform: string;
  username: string;
  profileUrl?: string;
  followers?: number;
  avgViews?: number;
  engagementRate?: number;
}

const unwrapCreators = (payload: SearchResponse | unknown[]): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.creators)) return payload.creators;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
};

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

  async getAll(filters?: CreatorFilters): Promise<Creator[]> {
    const payload = await apiClient.get<SearchResponse | unknown[]>('/api/v1/creators', {
      query: {
        search: filters?.search,
        city: filters?.cities?.[0],
        minFollowers: filters?.minFollowers,
        maxFollowers: filters?.maxFollowers,
        minRating: filters?.minRating,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        acceptsBarter: filters?.dealTypes?.includes('barter') ? true : undefined,
        isTrending: filters?.sortBy === 'trending' ? true : undefined,
        sortBy: filters?.sortBy,
        limit: 50,
      },
      auth: false,
    });

    let results = unwrapCreators(payload).map((creator) => mapCreator(creator as never));

    if (filters?.categories?.length) {
      results = results.filter((creator) => creator.categories.some((category) => filters.categories?.includes(category)));
    }

    if (filters?.platforms?.length) {
      results = results.filter((creator) => creator.platforms.some((platform) => filters.platforms?.includes(platform.platform)));
    }

    if (filters?.cities?.length) {
      results = results.filter((creator) => filters.cities?.includes(creator.city));
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

    return results;
  },

  async getById(id: string): Promise<Creator | null> {
    const response = await apiClient.get<unknown>(`/api/v1/creators/${id}`, { auth: false });
    return response ? mapCreator(response as never) : null;
  },

  async getByUsername(username: string): Promise<Creator | null> {
    const creators = await this.getAll({ search: username });
    return creators.find((creator) => creator.username === username) || null;
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

  async getByCity(city: string, limit = 6): Promise<Creator[]> {
    const response = await apiClient.get<SearchResponse | unknown[]>('/api/v1/creators/by-city', {
      query: { city, limit },
      auth: false,
    });

    return unwrapCreators(response).map((creator) => mapCreator(creator as never));
  },
};
