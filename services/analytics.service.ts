import { apiClient } from '@/lib/api/client';

export interface CreatorDashboardAnalytics {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalEarnings: number;
  avgRating: number;
  totalReviews: number;
  repeatBrands: number;
}

export const analyticsService = {
  async getCreatorDashboard(): Promise<CreatorDashboardAnalytics> {
    return apiClient.get<CreatorDashboardAnalytics>('/api/v1/analytics/creator/dashboard');
  },
};
