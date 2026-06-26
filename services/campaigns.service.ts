import { apiClient } from '@/lib/api/client';
import type {
  BrandCampaign,
  BrandCampaignReaction,
  BrandCampaignReactionStatus,
  BrandCampaignReactionType,
  BrandCampaignStatus,
} from '@/types';

interface BackendBrandCampaign {
   id: string;
   brandId: string;
   brandName?: string;
   title: string;
   brief: string;
   offerType: string;
   budgetMin: number;
   budgetMax: number;
   currency?: string;
   budgetType?: string;
   paymentStructure?: string;
   barterProductDesc?: string;
   barterEstimatedValue?: number;
   travelCostsCovered?: boolean;
   deliverables?: string;
   contentFormats?: string;
   targetPlatforms?: string;
   campaignGoal?: string;
   categories?: string;
   referenceUrls?: string;
   keyMessage?: string;
   dosAndDonts?: string;
   hashtagsMentions?: string;
   usageRights?: string;
   termsAndConditions?: string;
   expectedOutcomes?: string;
   coverImageUrl?: string;
   deadlineDate?: string;
   locationTargetingMode?: 'nationwide' | 'region' | 'cities' | 'remote_only';
   targetCities?: string;
   targetRegion?: string;
   targetCity?: string;
   targetLanguage?: string;
   visibility?: 'public' | 'private';
   creatorType?: string;
   followerRange?: string;
   creatorGenderPreference?: string;
   minAge?: number;
   maxAge?: number;
   applicationType?: string;
   maxApplicants?: number;
   proposalRequired?: boolean;
   portfolioRequired?: boolean;
   customScreeningQuestions?: string;
   contentSubmissionDeadline?: string;
   goLiveDate?: string;
   campaignDuration?: number;
   status: string;
   publishedAt?: string;
   closedAt?: string;
   createdAt?: string;
   updatedAt?: string;
   minProposedPrice?: number;
   reactionCount?: number;
 }

interface BackendCampaignReaction {
  id: string;
  campaignId: string;
  campaignTitle?: string;
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
  orderId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const toDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeCampaignStatus = (value?: string): BrandCampaignStatus => {
  const next = (value || '').toLowerCase();
  if (next === 'published' || next === 'paused' || next === 'closed' || next === 'archived') return next;
  return 'draft';
};

const normalizeReactionType = (value?: string): BrandCampaignReactionType => {
  const next = (value || '').toLowerCase();
  if (next === 'proposal' || next === 'question' || next === 'decline') return next;
  return 'interested';
};

const normalizeReactionStatus = (value?: string): BrandCampaignReactionStatus => {
  const next = (value || '').toLowerCase();
  if (next === 'shortlisted' || next === 'in_review' || next === 'accepted' || next === 'rejected' || next === 'withdrawn') return next;
  return 'submitted';
};

const mapCampaign = (input: BackendBrandCampaign): BrandCampaign => ({
   id: input.id,
   brandId: input.brandId,
   brandName: input.brandName || 'Brand',
   title: input.title,
   brief: input.brief,
   offerType: input.offerType,
   budgetMin: input.budgetMin,
   budgetMax: input.budgetMax,
   currency: input.currency || 'PKR',
   budgetType: input.budgetType,
   paymentStructure: input.paymentStructure,
   barterProductDesc: input.barterProductDesc,
   barterEstimatedValue: input.barterEstimatedValue,
   travelCostsCovered: input.travelCostsCovered,
   deliverables: input.deliverables,
   contentFormats: input.contentFormats,
   targetPlatforms: input.targetPlatforms,
   campaignGoal: input.campaignGoal,
   categories: input.categories,
   referenceUrls: input.referenceUrls,
   keyMessage: input.keyMessage,
   dosAndDonts: input.dosAndDonts,
   hashtagsMentions: input.hashtagsMentions,
   usageRights: input.usageRights,
   termsAndConditions: input.termsAndConditions,
   expectedOutcomes: input.expectedOutcomes,
   coverImageUrl: input.coverImageUrl,
   deadlineDate: input.deadlineDate,
   locationTargetingMode: input.locationTargetingMode,
   targetCities: input.targetCities,
   targetRegion: input.targetRegion,
   targetCity: input.targetCity,
   targetLanguage: input.targetLanguage,
   visibility: input.visibility || 'public',
   creatorType: input.creatorType,
   followerRange: input.followerRange,
   creatorGenderPreference: input.creatorGenderPreference,
   minAge: input.minAge,
   maxAge: input.maxAge,
   applicationType: input.applicationType,
   maxApplicants: input.maxApplicants,
   proposalRequired: input.proposalRequired,
   portfolioRequired: input.portfolioRequired,
   customScreeningQuestions: input.customScreeningQuestions,
   contentSubmissionDeadline: input.contentSubmissionDeadline,
   goLiveDate: input.goLiveDate,
   campaignDuration: input.campaignDuration,
   minProposedPrice: input.minProposedPrice ?? undefined,
   status: normalizeCampaignStatus(input.status),
   publishedAt: toDate(input.publishedAt),
   closedAt: toDate(input.closedAt),
   createdAt: toDate(input.createdAt) || new Date(),
   updatedAt: toDate(input.updatedAt) || new Date(),
   reactionCount: input.reactionCount || 0,
 });

const mapReaction = (input: BackendCampaignReaction): BrandCampaignReaction => ({
  id: input.id,
  campaignId: input.campaignId,
  campaignTitle: input.campaignTitle,
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
  orderId: input.orderId,
  createdAt: toDate(input.createdAt) || new Date(),
  updatedAt: toDate(input.updatedAt) || new Date(),
});

export const campaignsService = {
   async createCampaign(payload: {
     title: string;
     brief: string;
     offerType: string;
     budgetMin: number;
     budgetMax: number;
     currency?: string;
     budgetType?: string;
     paymentStructure?: string;
     barterProductDesc?: string;
     barterEstimatedValue?: number;
     travelCostsCovered?: boolean;
     deliverables?: string;
     contentFormats?: string;
     targetPlatforms?: string;
     campaignGoal?: string;
     categories?: string;
     referenceUrls?: string;
     keyMessage?: string;
     dosAndDonts?: string;
     hashtagsMentions?: string;
     usageRights?: string;
     termsAndConditions?: string;
     expectedOutcomes?: string;
     coverImageUrl?: string;
     deadlineDate?: string;
     locationTargetingMode?: 'nationwide' | 'region' | 'cities' | 'remote_only';
     targetCities?: string;
     targetRegion?: string;
     targetCity?: string;
     targetLanguage?: string;
     visibility?: 'public' | 'private';
     creatorType?: string;
     followerRange?: string;
     creatorGenderPreference?: string;
     minAge?: number;
     maxAge?: number;
     applicationType?: string;
     maxApplicants?: number;
     proposalRequired?: boolean;
     portfolioRequired?: boolean;
     customScreeningQuestions?: string;
     contentSubmissionDeadline?: string;
     goLiveDate?: string;
     campaignDuration?: number;
     minProposedPrice?: number;
   }): Promise<BrandCampaign> {
     const response = await apiClient.post<BackendBrandCampaign>('/api/v1/brand/campaigns', payload);
     return mapCampaign(response);
   },

   async updateCampaign(campaignId: string, payload: Partial<{
     title: string;
     brief: string;
     offerType: string;
     budgetMin: number;
     budgetMax: number;
     currency: string;
     budgetType: string;
     paymentStructure: string;
     barterProductDesc: string;
     barterEstimatedValue: number;
     travelCostsCovered: boolean;
     deliverables: string;
     contentFormats: string;
     targetPlatforms: string;
     campaignGoal: string;
     categories: string;
     referenceUrls: string;
     keyMessage: string;
     dosAndDonts: string;
     hashtagsMentions: string;
     usageRights: string;
     termsAndConditions: string;
     expectedOutcomes: string;
     coverImageUrl: string;
     deadlineDate: string;
     locationTargetingMode: 'nationwide' | 'region' | 'cities' | 'remote_only';
     targetCities: string;
     targetRegion: string;
     targetCity: string;
     targetLanguage: string;
     visibility: 'public' | 'private';
     creatorType: string;
     followerRange: string;
     creatorGenderPreference: string;
     minAge: number;
     maxAge: number;
     applicationType: string;
     maxApplicants: number;
     proposalRequired: boolean;
     portfolioRequired: boolean;
     customScreeningQuestions: string;
     contentSubmissionDeadline: string;
     goLiveDate: string;
     campaignDuration: number;
     minProposedPrice: number;
   }>): Promise<BrandCampaign> {
     const response = await apiClient.patch<BackendBrandCampaign>(`/api/v1/brand/campaigns/${campaignId}`, payload);
     return mapCampaign(response);
   },

  async updateCampaignStatus(campaignId: string, status: Uppercase<BrandCampaignStatus>): Promise<BrandCampaign> {
    const response = await apiClient.patch<BackendBrandCampaign>(`/api/v1/brand/campaigns/${campaignId}/status`, { status });
    return mapCampaign(response);
  },

  async getBrandCampaigns(page = 0, size = 20, status?: string): Promise<{ content: BrandCampaign[]; totalElements: number; totalPages: number; last: boolean }> {
    const response = await apiClient.get<{ content: BackendBrandCampaign[]; totalElements: number; totalPages: number; last: boolean }>('/api/v1/brand/campaigns', { query: { page, size, status: status || undefined } });
    return {
      content: (response.content || []).map(mapCampaign),
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 1,
      last: response.last ?? true,
    };
  },

  async getBrandCampaign(campaignId: string): Promise<BrandCampaign> {
    const response = await apiClient.get<BackendBrandCampaign>(`/api/v1/brand/campaigns/${campaignId}`);
    return mapCampaign(response);
  },

  async cloneCampaign(campaignId: string): Promise<BrandCampaign> {
    const source = await this.getBrandCampaign(campaignId);
    const response = await apiClient.post<BackendBrandCampaign>('/api/v1/brand/campaigns', {
      title: `${source.title} (copy)`,
      brief: source.brief,
      offerType: source.offerType,
      budgetMin: source.budgetMin,
      budgetMax: source.budgetMax,
      currency: source.currency,
      budgetType: source.budgetType,
      paymentStructure: source.paymentStructure,
      barterProductDesc: source.barterProductDesc,
      barterEstimatedValue: source.barterEstimatedValue,
      travelCostsCovered: source.travelCostsCovered,
      deliverables: source.deliverables,
      contentFormats: source.contentFormats,
      targetPlatforms: source.targetPlatforms,
      campaignGoal: source.campaignGoal,
      categories: source.categories,
      referenceUrls: source.referenceUrls,
      keyMessage: source.keyMessage,
      dosAndDonts: source.dosAndDonts,
      hashtagsMentions: source.hashtagsMentions,
      usageRights: source.usageRights,
      termsAndConditions: source.termsAndConditions,
      expectedOutcomes: source.expectedOutcomes,
      locationTargetingMode: source.locationTargetingMode,
      targetCities: source.targetCities,
      targetRegion: source.targetRegion,
      targetCity: source.targetCity,
      targetLanguage: source.targetLanguage,
      visibility: source.visibility,
      creatorType: source.creatorType,
      followerRange: source.followerRange,
      creatorGenderPreference: source.creatorGenderPreference,
      minAge: source.minAge,
      maxAge: source.maxAge,
      applicationType: source.applicationType,
      maxApplicants: source.maxApplicants,
      proposalRequired: source.proposalRequired,
      portfolioRequired: source.portfolioRequired,
      customScreeningQuestions: source.customScreeningQuestions,
      contentSubmissionDeadline: source.contentSubmissionDeadline,
      goLiveDate: source.goLiveDate,
      campaignDuration: source.campaignDuration,
      minProposedPrice: source.minProposedPrice,
    });
    return mapCampaign(response);
  },

  async getCampaignReactions(campaignId: string, filters?: {
    status?: string;
    reactionType?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: BrandCampaignReaction[]; totalElements: number; totalPages: number; last: boolean }> {
    const response = await apiClient.get<{ content: BackendCampaignReaction[]; totalElements: number; totalPages: number; last: boolean }>(`/api/v1/brand/campaigns/${campaignId}/reactions`, {
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

  async actionReaction(campaignId: string, reactionId: string, action: 'SHORTLIST' | 'REVIEW' | 'ACCEPT' | 'REJECT', brandNote?: string): Promise<BrandCampaignReaction> {
    const response = await apiClient.patch<BackendCampaignReaction>(`/api/v1/brand/campaigns/${campaignId}/reactions/${reactionId}`, {
      action,
      brandNote,
    });
    return mapReaction(response);
  },

  async getCreatorCampaignFeed(filters?: {
    search?: string;
    city?: string;
    offerType?: string;
    platform?: string;
    campaignGoal?: string;
    budgetMin?: number;
    budgetMax?: number;
    page?: number;
    size?: number;
  }): Promise<{ content: BrandCampaign[]; totalElements: number; totalPages: number; last: boolean }> {
    const response = await apiClient.get<{ content: BackendBrandCampaign[]; totalElements: number; totalPages: number; last: boolean }>('/api/v1/creator/campaigns', {
      query: {
        search: filters?.search,
        city: filters?.city,
        offerType: filters?.offerType,
        platform: filters?.platform,
        campaignGoal: filters?.campaignGoal,
        budgetMin: filters?.budgetMin,
        budgetMax: filters?.budgetMax,
        page: filters?.page ?? 0,
        size: filters?.size ?? 20,
      },
    });
    return {
      content: (response.content || []).map(mapCampaign),
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 1,
      last: response.last ?? true,
    };
  },

  async getCreatorCampaign(campaignId: string): Promise<BrandCampaign> {
    const response = await apiClient.get<BackendBrandCampaign>(`/api/v1/creator/campaigns/${campaignId}`);
    return mapCampaign(response);
  },

  async reactToCampaign(campaignId: string, payload: {
    reactionType: Uppercase<BrandCampaignReactionType>;
    message?: string;
    proposedPrice?: number;
    proposedCurrency?: string;
    proposedDeliveryDays?: number;
    creatorNote?: string;
  }): Promise<BrandCampaignReaction> {
    const response = await apiClient.post<BackendCampaignReaction>(`/api/v1/creator/campaigns/${campaignId}/reactions`, payload);
    return mapReaction(response);
  },

  async updateCreatorReaction(campaignId: string, reactionId: string, payload: {
    message?: string;
    proposedPrice?: number;
    proposedCurrency?: string;
    proposedDeliveryDays?: number;
    creatorNote?: string;
    status?: Uppercase<BrandCampaignReactionStatus>;
  }): Promise<BrandCampaignReaction> {
    const response = await apiClient.patch<BackendCampaignReaction>(`/api/v1/creator/campaigns/${campaignId}/reactions/${reactionId}`, payload);
    return mapReaction(response);
  },

  async getMyReactions(page = 0, size = 20): Promise<{ content: BrandCampaignReaction[]; totalElements: number; totalPages: number; last: boolean }> {
    const response = await apiClient.get<{ content: BackendCampaignReaction[]; totalElements: number; totalPages: number; last: boolean }>('/api/v1/creator/campaigns/reactions/mine', { query: { page, size } });
    return {
      content: (response.content || []).map(mapReaction),
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 1,
      last: response.last ?? true,
    };
  },
};
