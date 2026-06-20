import { apiClient } from '@/lib/api/client';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';
export type DisputeResolution =
  | 'none'
  | 'refund_issued'
  | 'resolved_for_brand'
  | 'resolved_for_creator'
  | 'withdrawn';

export interface Dispute {
  id: string;
  orderId: string;
  orderNumber?: string;
  title: string;
  description: string;
  status: DisputeStatus;
  priority: string;
  resolution: DisputeResolution;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  creatorName: string;
  brandId: string;
  brandName: string;
  packageTitle: string;
}

export interface OpenDisputeRequest {
  orderId: string;
  title: string;
  description: string;
}

interface RawDisputeListResponse {
  disputes?: Dispute[];
  total?: number;
  page?: number;
}

export const disputesService = {
  async openDispute(payload: OpenDisputeRequest): Promise<Dispute> {
    return apiClient.post<Dispute>('/api/v1/disputes', payload);
  },

  async getMyDisputes(page = 0, limit = 20): Promise<{ disputes: Dispute[]; total: number }> {
    const response = await apiClient.get<RawDisputeListResponse | Dispute[]>('/api/v1/disputes', {
      query: { page, limit },
    });
    if (Array.isArray(response)) {
      return { disputes: response, total: response.length };
    }
    const r = response as RawDisputeListResponse;
    return { disputes: r.disputes ?? [], total: r.total ?? 0 };
  },

  async getDispute(id: string): Promise<Dispute> {
    return apiClient.get<Dispute>(`/api/v1/disputes/${id}`);
  },
};
