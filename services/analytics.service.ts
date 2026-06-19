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

export interface BrandAnalyticsCity {
  city: string;
  orders: number;
  share: number;
}

export interface BrandCampaignAnalytics {
  totalReach: number;
  avgEngagementRate: number;
  creatorsActive: number;
  monthlySpend: number;
  totalOrders: number;
  completedOrders: number;
  topCities: BrandAnalyticsCity[];
  dealMix: {
    paid: number;
    hybrid: number;
    barter: number;
  };
}

export interface BrandDashboardAnalytics {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  savedCreators: number;
  totalSpent: number;
  creatorsWorkedWith: number;
  avgRating: number;
}

export interface BrandCreatorSpend {
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  totalSpend: number;
  orderCount: number;
  completedOrders: number;
  avgRating?: number;
}

export interface BrandCampaignCompletionRate {
  campaignId: string;
  campaignTitle: string;
  totalOrders: number;
  completedOrders: number;
  completionRate: number;
}

export interface BrandExtendedAnalytics {
  onTimeDeliveryPct: number;
  repeatCreatorRate: number;
  topCreatorsBySpend: BrandCreatorSpend[];
  campaignCompletionRates: BrandCampaignCompletionRate[];
  dealTypeROI: {
    paid: { count: number; totalSpend: number; avgEngagement: number };
    barter: { count: number; totalSpend: number; avgEngagement: number };
    hybrid: { count: number; totalSpend: number; avgEngagement: number };
  };
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

  async getBrandCampaigns(period?: string): Promise<BrandCampaignAnalytics> {
    return apiClient.get<BrandCampaignAnalytics>('/api/v1/analytics/brand/campaigns', period ? { query: { period } } : undefined);
  },

  async getBrandDashboard(): Promise<BrandDashboardAnalytics> {
    return apiClient.get<BrandDashboardAnalytics>('/api/v1/analytics/brand/dashboard');
  },

  async getBrandExtended(period?: string): Promise<BrandExtendedAnalytics> {
    const result = await apiClient
      .get<BrandExtendedAnalytics>(
        '/api/v1/analytics/brand/extended',
        period ? { query: { period } } : undefined,
      )
      .catch(() => null);
    return result ?? {
      onTimeDeliveryPct: 0,
      repeatCreatorRate: 0,
      topCreatorsBySpend: [],
      campaignCompletionRates: [],
      dealTypeROI: {
        paid: { count: 0, totalSpend: 0, avgEngagement: 0 },
        barter: { count: 0, totalSpend: 0, avgEngagement: 0 },
        hybrid: { count: 0, totalSpend: 0, avgEngagement: 0 },
      },
    };
  },
};
