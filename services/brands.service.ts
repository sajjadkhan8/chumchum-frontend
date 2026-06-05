import { apiClient } from '@/lib/api/client';
import { mapBrand } from '@/lib/api/mappers';
import type { Brand } from '@/types';

export interface BrandProfileUpdatePayload {
  companyName?: string;
  website?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  monthlyBudget?: number;
  preferredCreatorCategories?: string;
  targetCities?: string;
  targetPlatforms?: string;
  campaignBudgetRange?: string;
  businessVerificationStatus?: string;
  verificationContactEmail?: string;
  verificationPhoneNumber?: string;
}

export const brandsService = {
  async getMe(): Promise<Brand | null> {
    const response = await apiClient.get<unknown>('/api/v1/brands/me/profile');
    return response ? mapBrand(response as never) : null;
  },

  async updateMe(payload: BrandProfileUpdatePayload): Promise<Brand> {
    const response = await apiClient.patch<unknown>('/api/v1/brands/me/profile', {
      company_name: payload.companyName,
      website: payload.website,
      industry: payload.industry,
      description: payload.description,
      logo_url: payload.logoUrl,
      monthly_budget: payload.monthlyBudget,
      preferred_creator_categories: payload.preferredCreatorCategories,
      target_cities: payload.targetCities,
      target_platforms: payload.targetPlatforms,
      campaign_budget_range: payload.campaignBudgetRange,
      business_verification_status: payload.businessVerificationStatus,
      verification_contact_email: payload.verificationContactEmail,
      verification_phone_number: payload.verificationPhoneNumber,
    });

    return mapBrand(response as never);
  },
};
