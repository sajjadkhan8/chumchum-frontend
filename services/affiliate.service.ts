import { apiClient } from '@/lib/api/client';

export interface AffiliateOverview {
  code: string;
  shareUrl: string;
  rateBasisPoints: number;
  totalCommission: number;
  referredCreators: number;
  commissionCount: number;
}

export interface AffiliateCommission {
  id: string;
  orderId: string;
  orderNumber?: string;
  earningCreatorId: string;
  earningCreatorName: string;
  baseAmount: number;
  rateBasisPoints: number;
  commissionAmount: number;
  status: 'credited' | 'pending_payout_unsupported';
  createdAt: string;
}

interface AffiliateCommissionPage {
  commissions?: AffiliateCommission[];
  total?: number;
  page?: number;
  limit?: number;
}

export const affiliateService = {
  async getOverview(): Promise<AffiliateOverview> {
    return apiClient.get<AffiliateOverview>('/api/v1/affiliate/me');
  },

  async createOrGetLink(): Promise<AffiliateOverview> {
    return apiClient.post<AffiliateOverview>('/api/v1/affiliate/link');
  },

  async getCommissions(page = 0, limit = 20): Promise<AffiliateCommission[]> {
    const response = await apiClient.get<AffiliateCommissionPage>('/api/v1/affiliate/commissions', {
      query: { page, limit },
    });
    return response.commissions || [];
  },
};
