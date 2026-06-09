import { apiClient } from '@/lib/api/client';
import type {
  BrandOffer,
  BrandOfferReaction,
  BrandOfferReactionStatus,
  BrandOfferReactionType,
  BrandOfferStatus,
} from '@/types';

interface BackendBrandOffer {
  id: string;
  brandId: string;
  brandName?: string;
  title: string;
  brief: string;
  offerType: string;
  budgetMin: number;
  budgetMax: number;
  currency?: string;
  deliverables?: string;
  contentFormats?: string;
  targetPlatforms?: string;
  categories?: string;
  niches?: string;
  tags?: string;
  requirements?: string;
  referenceUrls?: string;
  coverImageUrl?: string;
  deadlineDate?: string;
  targetCity?: string;
  targetLanguage?: string;
  minFollowers?: number;
  minEngagementRate?: number;
  preferredDeliveryDays?: number;
  slots?: number;
  visibility?: 'public' | 'private';
  status: string;
  publishedAt?: string;
  closedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  reactionCount?: number;
}

interface BackendOfferReaction {
  id: string;
  offerId: string;
  offerTitle?: string;
  brandName?: string;
  creatorId: string;
  creatorName?: string;
  creatorAvatar?: string;
  reactionType: string;
  status: string;
  message?: string;
  proposedPrice?: number;
  proposedCurrency?: string;
  proposedDeliveryDays?: number;
  brandNote?: string;
  creatorNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

const toDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeOfferStatus = (value?: string): BrandOfferStatus => {
  const next = (value || '').toLowerCase();
  if (next === 'published' || next === 'paused' || next === 'closed' || next === 'archived') return next;
  return 'draft';
};

const normalizeReactionType = (value?: string): BrandOfferReactionType => {
  const next = (value || '').toLowerCase();
  if (next === 'proposal' || next === 'question' || next === 'decline') return next;
  return 'interested';
};

const normalizeReactionStatus = (value?: string): BrandOfferReactionStatus => {
  const next = (value || '').toLowerCase();
  if (next === 'shortlisted' || next === 'in_review' || next === 'accepted' || next === 'rejected' || next === 'withdrawn') return next;
  return 'submitted';
};

const mapOffer = (input: BackendBrandOffer): BrandOffer => ({
  id: input.id,
  brandId: input.brandId,
  brandName: input.brandName || 'Brand',
  title: input.title,
  brief: input.brief,
  offerType: input.offerType,
  budgetMin: input.budgetMin,
  budgetMax: input.budgetMax,
  currency: input.currency || 'PKR',
  deliverables: input.deliverables,
  contentFormats: input.contentFormats,
  targetPlatforms: input.targetPlatforms,
  categories: input.categories,
  niches: input.niches,
  tags: input.tags,
  requirements: input.requirements,
  referenceUrls: input.referenceUrls,
  coverImageUrl: input.coverImageUrl,
  deadlineDate: input.deadlineDate,
  targetCity: input.targetCity,
  targetLanguage: input.targetLanguage,
  minFollowers: input.minFollowers,
  minEngagementRate: input.minEngagementRate,
  preferredDeliveryDays: input.preferredDeliveryDays,
  slots: input.slots,
  visibility: input.visibility || 'public',
  status: normalizeOfferStatus(input.status),
  publishedAt: toDate(input.publishedAt),
  closedAt: toDate(input.closedAt),
  createdAt: toDate(input.createdAt) || new Date(),
  updatedAt: toDate(input.updatedAt) || new Date(),
  reactionCount: input.reactionCount || 0,
});

const mapReaction = (input: BackendOfferReaction): BrandOfferReaction => ({
  id: input.id,
  offerId: input.offerId,
  offerTitle: input.offerTitle,
  brandName: input.brandName,
  creatorId: input.creatorId,
  creatorName: input.creatorName || 'Creator',
  creatorAvatar: input.creatorAvatar,
  reactionType: normalizeReactionType(input.reactionType),
  status: normalizeReactionStatus(input.status),
  message: input.message,
  proposedPrice: input.proposedPrice,
  proposedCurrency: input.proposedCurrency || 'PKR',
  proposedDeliveryDays: input.proposedDeliveryDays,
  brandNote: input.brandNote,
  creatorNote: input.creatorNote,
  createdAt: toDate(input.createdAt) || new Date(),
  updatedAt: toDate(input.updatedAt) || new Date(),
});

export const offersService = {
  async createOffer(payload: {
    title: string;
    brief: string;
    offerType: string;
    budgetMin: number;
    budgetMax: number;
    currency?: string;
    deliverables?: string;
    contentFormats?: string;
    targetPlatforms?: string;
    categories?: string;
    niches?: string;
    tags?: string;
    requirements?: string;
    referenceUrls?: string;
    coverImageUrl?: string;
    deadlineDate?: string;
    targetCity?: string;
    targetLanguage?: string;
    minFollowers?: number;
    minEngagementRate?: number;
    preferredDeliveryDays?: number;
    slots?: number;
    visibility?: 'public' | 'private';
  }): Promise<BrandOffer> {
    const response = await apiClient.post<BackendBrandOffer>('/api/v1/brand/offers', payload);
    return mapOffer(response);
  },

  async updateOffer(offerId: string, payload: Partial<{
    title: string;
    brief: string;
    offerType: string;
    budgetMin: number;
    budgetMax: number;
    currency: string;
    deliverables: string;
    contentFormats: string;
    targetPlatforms: string;
    categories: string;
    niches: string;
    tags: string;
    requirements: string;
    referenceUrls: string;
    coverImageUrl: string;
    deadlineDate: string;
    targetCity: string;
    targetLanguage: string;
    minFollowers: number;
    minEngagementRate: number;
    preferredDeliveryDays: number;
    slots: number;
    visibility: 'public' | 'private';
  }>): Promise<BrandOffer> {
    const response = await apiClient.patch<BackendBrandOffer>(`/api/v1/brand/offers/${offerId}`, payload);
    return mapOffer(response);
  },

  async updateOfferStatus(offerId: string, status: Uppercase<BrandOfferStatus>): Promise<BrandOffer> {
    const response = await apiClient.patch<BackendBrandOffer>(`/api/v1/brand/offers/${offerId}/status`, { status });
    return mapOffer(response);
  },

  async getBrandOffers(page = 0, size = 20): Promise<{ content: BrandOffer[]; totalElements: number; totalPages: number; last: boolean }> {
    const response = await apiClient.get<{ content: BackendBrandOffer[]; totalElements: number; totalPages: number; last: boolean }>('/api/v1/brand/offers', { query: { page, size } });
    return {
      content: (response.content || []).map(mapOffer),
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 1,
      last: response.last ?? true,
    };
  },

  async getBrandOffer(offerId: string): Promise<BrandOffer> {
    const response = await apiClient.get<BackendBrandOffer>(`/api/v1/brand/offers/${offerId}`);
    return mapOffer(response);
  },

  async getOfferReactions(offerId: string, filters?: {
    status?: string;
    reactionType?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: BrandOfferReaction[]; totalElements: number; totalPages: number; last: boolean }> {
    const response = await apiClient.get<{ content: BackendOfferReaction[]; totalElements: number; totalPages: number; last: boolean }>(`/api/v1/brand/offers/${offerId}/reactions`, {
      query: {
        status: filters?.status,
        reactionType: filters?.reactionType,
        page: filters?.page ?? 0,
        size: filters?.size ?? 20,
      },
    });
    return {
      content: (response.content || []).map(mapReaction),
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 1,
      last: response.last ?? true,
    };
  },

  async actionReaction(offerId: string, reactionId: string, action: 'SHORTLIST' | 'REVIEW' | 'ACCEPT' | 'REJECT', brandNote?: string): Promise<BrandOfferReaction> {
    const response = await apiClient.patch<BackendOfferReaction>(`/api/v1/brand/offers/${offerId}/reactions/${reactionId}`, {
      action,
      brandNote,
    });
    return mapReaction(response);
  },

  async getCreatorOfferFeed(filters?: {
    search?: string;
    city?: string;
    offerType?: string;
    platform?: string;
    budgetMin?: number;
    budgetMax?: number;
    myFollowers?: number;
    page?: number;
    size?: number;
  }): Promise<{ content: BrandOffer[]; totalElements: number; totalPages: number; last: boolean }> {
    const response = await apiClient.get<{ content: BackendBrandOffer[]; totalElements: number; totalPages: number; last: boolean }>('/api/v1/creator/offers', {
      query: {
        search: filters?.search,
        city: filters?.city,
        offerType: filters?.offerType,
        platform: filters?.platform,
        budgetMin: filters?.budgetMin,
        budgetMax: filters?.budgetMax,
        myFollowers: filters?.myFollowers,
        page: filters?.page ?? 0,
        size: filters?.size ?? 20,
      },
    });
    return {
      content: (response.content || []).map(mapOffer),
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 1,
      last: response.last ?? true,
    };
  },

  async getCreatorOffer(offerId: string): Promise<BrandOffer> {
    const response = await apiClient.get<BackendBrandOffer>(`/api/v1/creator/offers/${offerId}`);
    return mapOffer(response);
  },

  async reactToOffer(offerId: string, payload: {
    reactionType: Uppercase<BrandOfferReactionType>;
    message?: string;
    proposedPrice?: number;
    proposedCurrency?: string;
    proposedDeliveryDays?: number;
    creatorNote?: string;
  }): Promise<BrandOfferReaction> {
    const response = await apiClient.post<BackendOfferReaction>(`/api/v1/creator/offers/${offerId}/reactions`, payload);
    return mapReaction(response);
  },

  async updateCreatorReaction(offerId: string, reactionId: string, payload: {
    message?: string;
    proposedPrice?: number;
    proposedCurrency?: string;
    proposedDeliveryDays?: number;
    creatorNote?: string;
    status?: Uppercase<BrandOfferReactionStatus>;
  }): Promise<BrandOfferReaction> {
    const response = await apiClient.patch<BackendOfferReaction>(`/api/v1/creator/offers/${offerId}/reactions/${reactionId}`, payload);
    return mapReaction(response);
  },

  async getMyReactions(page = 0, size = 20): Promise<{ content: BrandOfferReaction[]; totalElements: number; totalPages: number; last: boolean }> {
    const response = await apiClient.get<{ content: BackendOfferReaction[]; totalElements: number; totalPages: number; last: boolean }>('/api/v1/creator/offers/reactions/mine', { query: { page, size } });
    return {
      content: (response.content || []).map(mapReaction),
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 1,
      last: response.last ?? true,
    };
  },
};


