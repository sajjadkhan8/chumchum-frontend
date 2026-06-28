import { apiClient } from '@/lib/api/client';
import { mapBrand } from '@/lib/api/mappers';
import type { Brand } from '@/types';

export interface VerificationDocument {
  id: string;
  type: 'tax_id' | 'business_registration' | 'bank_details';
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface VerificationDocumentUpload {
  type: 'tax_id' | 'business_registration' | 'bank_details';
  fileUrl: string;
  fileName: string;
}

export interface VerificationEvent {
  id: string;
  eventType: string;
  details?: string;
  documentId?: string;
  createdAt: string;
}

export interface BrandProfileUpdatePayload {
  companyName?: string;
  website?: string;
  category?: string;
  description?: string;
  logoUrl?: string;
  monthlyBudget?: number;
  preferredCreatorCategories?: string;
  city?: string;
  companySize?: string;
  contactName?: string;
}

export const brandsService = {
  async getAll(): Promise<Brand[]> {
    const response = await apiClient.get<unknown[]>('/api/v1/brands', { auth: false });
    return (Array.isArray(response) ? response : []).map((brand) => mapBrand(brand as never));
  },

  async getMe(): Promise<Brand | null> {
    const response = await apiClient.get<unknown>('/api/v1/brands/me/profile');
    return response ? mapBrand(response as never) : null;
  },

  async selectPlan(planTier: 'STARTER' | 'GROWTH' | 'ENTERPRISE'): Promise<{ success: boolean; planTier: string }> {
    return apiClient.patch<{ success: boolean; planTier: string }>('/api/v1/brands/me/plan', { planTier });
  },

  async updateMe(payload: BrandProfileUpdatePayload): Promise<Brand> {
    const response = await apiClient.patch<unknown>('/api/v1/brands/me/profile', {
      company_name: payload.companyName,
      website: payload.website,
      category: payload.category,
      description: payload.description,
      logo_url: payload.logoUrl,
      monthly_budget: payload.monthlyBudget,
      preferred_creator_categories: payload.preferredCreatorCategories,
      city: payload.city,
      company_size: payload.companySize,
      contact_name: payload.contactName,
    });

    return mapBrand(response as never);
  },

  async getVerificationDocuments(): Promise<VerificationDocument[]> {
    return apiClient.get<VerificationDocument[]>('/api/v1/brands/me/verification-documents');
  },

  async getVerificationEvents(): Promise<VerificationEvent[]> {
    return apiClient.get<VerificationEvent[]>('/api/v1/brands/me/verification-events');
  },

  async submitVerificationDocument(doc: VerificationDocumentUpload): Promise<VerificationDocument> {
    return apiClient.post<VerificationDocument>('/api/v1/brands/me/verification-documents', doc);
  },

  async submitForReview(): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/api/v1/brands/me/verification/submit', {});
  },
};
