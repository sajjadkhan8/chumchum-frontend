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

export interface CreatorInsightsTotals {
  packageViews: number;
  packageViewsChange: number;
  inquiries: number;
  inquiriesChange: number;
  repeatBrands: number;
  repeatBrandsChange: number;
  avgConversionRate: number;
  avgConversionChange: number;
}

export interface CreatorInsightsTrendPoint {
  month: string;
  value: number;
}

export interface CreatorInsightsPlatformContribution {
  platform: string;
  views: number;
  clicks: number;
  inquiries: number;
  packageCount: number;
  score: number;
}

export interface CreatorInsightsTopPackage {
  packageId: string;
  title: string;
  platform: string;
  views: number;
  clicks: number;
  inquiries: number;
  conversionRate: number;
  completionRate: number;
  repeatBrands: number;
}

export interface CreatorInsightsAnalytics {
  totals: CreatorInsightsTotals;
  monthlyInquiryTrend: CreatorInsightsTrendPoint[];
  platformContribution: CreatorInsightsPlatformContribution[];
  topPackages: CreatorInsightsTopPackage[];
}

export interface CreatorPerformancePackage {
  packageId: string;
  title: string;
  views: number;
  clicks: number;
  inquiries: number;
  conversionRate: number;
  completionRate: number;
  repeatBrands: number;
  ctr: number;
  inquiryToClickRate: number;
  efficiencyScore: number;
}

export interface CreatorPerformanceAnalytics {
  packages: CreatorPerformancePackage[];
}

export const analyticsService = {
  async getCreatorDashboard(): Promise<CreatorDashboardAnalytics> {
    return apiClient.get<CreatorDashboardAnalytics>('/api/v1/analytics/creator/dashboard');
  },

  async getCreatorInsights(period?: string): Promise<CreatorInsightsAnalytics> {
    return apiClient.get<CreatorInsightsAnalytics>('/api/v1/analytics/creator/insights', period ? { query: { period } } : undefined);
  },

  async getCreatorPerformance(): Promise<CreatorPerformanceAnalytics> {
    return apiClient.get<CreatorPerformanceAnalytics>('/api/v1/analytics/creator/performance');
  },
};
