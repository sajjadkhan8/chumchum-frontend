import { apiClient } from '@/lib/api/client';
import { mapCreator } from '@/lib/api/mappers';
import type {
  AmbassadorApplication,
  AmbassadorApplicationStatus,
  AmbassadorEligibilityRequirements,
  CreatorAmbassadorMetrics,
  PlatformAmbassador,
} from '@/types';

export interface AmbassadorBenefit {
  title: string;
  description: string;
  icon: string;
}

interface ApplicationResponse {
  id: string;
  creatorId: string;
  status: AmbassadorApplicationStatus;
  submittedAt?: string;
  updatedAt?: string;
  verificationSteps?: {
    identityVerified: boolean;
    engagementVerified: boolean;
    contentReviewPassed: boolean;
    backgroundCheckPassed: boolean;
  };
  notes?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

const mapApplication = (input: ApplicationResponse): AmbassadorApplication => ({
  id: input.id,
  creatorId: input.creatorId,
  creator: null as never,
  status: input.status,
  submittedAt: input.submittedAt ? new Date(input.submittedAt) : new Date(),
  updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
  verificationSteps: input.verificationSteps || {
    identityVerified: false,
    engagementVerified: false,
    contentReviewPassed: false,
    backgroundCheckPassed: false,
  },
  notes: input.notes,
  approvedAt: input.approvedAt ? new Date(input.approvedAt) : undefined,
  rejectionReason: input.rejectionReason,
});

const defaultBenefits: AmbassadorBenefit[] = [
  {
    title: 'Monthly Guaranteed Income',
    description: 'Starting from PKR 1,250,000/month for eligible ambassadors.',
    icon: '💰',
  },
  {
    title: 'Direct Brand Access',
    description: 'Priority access to premium and enterprise campaigns.',
    icon: '🤝',
  },
  {
    title: 'Dedicated Account Manager',
    description: 'Personalized support for campaign planning and growth.',
    icon: '👔',
  },
  {
    title: 'Performance Bonuses',
    description: 'Tier-based bonus incentives based on delivery quality.',
    icon: '🏆',
  },
];

const defaultEligibilityRequirements: AmbassadorEligibilityRequirements & { minCompletedDeals: number } = {
  minFollowers: 100000,
  minEngagementRate: 5,
  minRating: 4.5,
  minCompletedDeals: 30,
  verificationSteps: [
    'Identity Verification (CNIC)',
    'Tax Profile Verification (NTN/STRN where applicable)',
    'Engagement Metrics Verification',
    'Content Quality & Brand Safety Review',
    'Background & Compliance Check',
  ],
};

const mapPlatformAmbassador = (input: unknown): PlatformAmbassador => {
  const creator = mapCreator(input as never);
  const payload = input as {
    ambassadorStatus?: PlatformAmbassador['ambassadorStatus'];
    commissionPercentage?: number;
    monthlyBase?: number;
    ambassadorSince?: string;
    performanceScore?: number;
    isExclusive?: boolean;
  };

  return {
    ...creator,
    ambassadorStatus: payload.ambassadorStatus || 'approved',
    commissionPercentage: payload.commissionPercentage || 15,
    monthlyBase: payload.monthlyBase,
    ambassadorSince: payload.ambassadorSince ? new Date(payload.ambassadorSince) : new Date(),
    performanceScore: payload.performanceScore || creator.rating,
    isExclusive: Boolean(payload.isExclusive),
  };
};

export const ambassadorService = {
  async getMyApplication(): Promise<AmbassadorApplication | null> {
    const response = await apiClient.get<ApplicationResponse | null>('/api/v1/ambassador/application');
    return response ? mapApplication(response) : null;
  },

  async submitApplication(): Promise<AmbassadorApplication> {
    const response = await apiClient.post<ApplicationResponse>('/api/v1/ambassador/application');
    return mapApplication(response);
  },

  async getScore(): Promise<CreatorAmbassadorMetrics> {
    return apiClient.get<CreatorAmbassadorMetrics>('/api/v1/ambassador/score');
  },

  async listAmbassadors(limit = 20): Promise<PlatformAmbassador[]> {
    const response = await apiClient.get<{ ambassadors?: unknown[] } | unknown[]>('/api/v1/ambassador/ambassadors', {
      query: { limit },
      auth: false,
    });

    const list = Array.isArray(response) ? response : response?.ambassadors || [];
    return list.map((item) => mapPlatformAmbassador(item));
  },

  async getBenefits(): Promise<AmbassadorBenefit[]> {
    try {
      const response = await apiClient.get<{ benefits?: AmbassadorBenefit[] } | AmbassadorBenefit[]>('/api/v1/ambassador/benefits', {
        auth: false,
      });
      if (Array.isArray(response)) return response;
      return response?.benefits?.length ? response.benefits : defaultBenefits;
    } catch {
      return defaultBenefits;
    }
  },

  async getEligibilityRequirements(): Promise<AmbassadorEligibilityRequirements & { minCompletedDeals: number }> {
    const endpoints = ['/api/v1/ambassador/eligibility', '/api/v1/ambassador/requirements'];
    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get<Partial<AmbassadorEligibilityRequirements & { minCompletedDeals: number }>>(endpoint, {
          auth: false,
        });

        return {
          minFollowers: response.minFollowers || defaultEligibilityRequirements.minFollowers,
          minEngagementRate: response.minEngagementRate || defaultEligibilityRequirements.minEngagementRate,
          minRating: response.minRating || defaultEligibilityRequirements.minRating,
          minCompletedDeals: response.minCompletedDeals || defaultEligibilityRequirements.minCompletedDeals,
          verificationSteps: response.verificationSteps || defaultEligibilityRequirements.verificationSteps,
        };
      } catch {
        // Try the next endpoint.
      }
    }

    return defaultEligibilityRequirements;
  },
};

