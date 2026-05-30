import type { PlatformAmbassador, AmbassadorApplication } from '@/types';
import { mockCreators } from './creators';

// These are the platform's curated ambassadors (vetted & managed by platform)
export const platformAmbassadors: PlatformAmbassador[] = [
  {
    ...mockCreators[0], // Ali Hassan Khan
    ambassadorStatus: 'approved',
    commissionPercentage: 15,
    monthlyBase: 1250000,
    ambassadorSince: new Date('2023-06-15'),
    performanceScore: 9.2,
    isExclusive: true,
  },
  {
    ...mockCreators[1], // Ayesha Malik
    ambassadorStatus: 'approved',
    commissionPercentage: 15,
    monthlyBase: 1875000,
    ambassadorSince: new Date('2023-04-20'),
    performanceScore: 9.5,
    isExclusive: true,
  },
  {
    ...mockCreators[2], // Hassan Ahmed
    ambassadorStatus: 'approved',
    commissionPercentage: 15,
    monthlyBase: 1500000,
    ambassadorSince: new Date('2023-08-10'),
    performanceScore: 8.8,
    isExclusive: false, // Can work with non-competing brands
  },
];

// Ambassador eligibility requirements (Pakistan market)
export const ambassadorEligibilityRequirements = {
  minFollowers: 100000, // Minimum 100k followers across all platforms
  minEngagementRate: 5.0, // Minimum 5% engagement rate
  minRating: 4.5, // Minimum 4.5 star rating
  minCompletedDeals: 30, // Must have completed at least 30 deals
  verificationSteps: [
    'Identity Verification (CNIC)',
    'Tax Profile Verification (NTN/STRN where applicable)',
    'Engagement Metrics Verification',
    'Content Quality & Brand Safety Review',
    'Background & Compliance Check',
  ],
};

// Realistic Pakistan-specific ambassador application statuses
export const ambassadorApplications: AmbassadorApplication[] = [
  {
    id: 'app-001',
    creatorId: '1',
    creator: mockCreators[0],
    status: 'approved',
    submittedAt: new Date('2023-05-01'),
    updatedAt: new Date('2023-06-15'),
    verificationSteps: {
      identityVerified: true,
      engagementVerified: true,
      contentReviewPassed: true,
      backgroundCheckPassed: true,
    },
    notes: 'Exceptional engagement metrics in food and lifestyle niche. Strong Pakistan audience fit.',
    approvedAt: new Date('2023-06-15'),
  },
  {
    id: 'app-002',
    creatorId: '4',
    creator: {
      ...mockCreators[1],
      id: '4',
    },
    status: 'approved',
    submittedAt: new Date('2023-03-15'),
    updatedAt: new Date('2023-04-20'),
    verificationSteps: {
      identityVerified: true,
      engagementVerified: true,
      contentReviewPassed: true,
      backgroundCheckPassed: true,
    },
    notes: 'Top-tier fashion & beauty creator. High engagement in TikTok. Brand-safe content.',
    approvedAt: new Date('2023-04-20'),
  },
  {
    id: 'app-003',
    creatorId: '5',
    creator: {
      id: '5',
      userId: 'u5',
      username: 'layla_wellness',
      name: 'Laiba Raza',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=400&fit=crop',
      bio: 'Health and wellness coach specializing in fitness routines for women in Pakistan.',
      city: 'Peshawar' as any,
      categories: ['Health', 'Fitness', 'Wellness'],
      platforms: [
        { platform: 'instagram' as any, followers: 250000, engagementRate: 5.3, username: 'layla_wellness' },
        { platform: 'tiktok' as any, followers: 180000, engagementRate: 6.1, username: 'layla_wellness' },
      ],
      totalFollowers: 430000,
      avgEngagementRate: 5.7,
      dealTypes: ['paid', 'barter'] as any,
      barterTypes: ['salon', 'products'] as any,
      minPrice: 625000,
      maxPrice: 3000000,
      responseTime: 'Within 3 hours',
      isVerified: true,
      isTrending: true,
      isFastResponder: false,
      rating: 4.7,
      totalReviews: 98,
      completedDeals: 67,
      contentPreviews: mockCreators[0].contentPreviews,
      createdAt: new Date('2022-11-15'),
    },
    status: 'under_review',
    submittedAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
    verificationSteps: {
      identityVerified: true,
      engagementVerified: true,
      contentReviewPassed: false,
      backgroundCheckPassed: false,
    },
    notes: 'Application under review. Waiting for content safety verification.',
  },
  {
    id: 'app-004',
    creatorId: '6',
    creator: {
      id: '6',
      userId: 'u6',
      username: 'ahmed_realestate',
      name: 'Ahmed Raza',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      coverImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=400&fit=crop',
      bio: 'Real estate investor and property consultant serving Pakistan market.',
      city: 'Karachi' as any,
      categories: ['Real Estate', 'Business', 'Finance'],
      platforms: [
        { platform: 'instagram' as any, followers: 95000, engagementRate: 4.2, username: 'ahmed_realestate' },
        { platform: 'tiktok' as any, followers: 78000, engagementRate: 3.9, username: 'ahmed_realestate' },
      ],
      totalFollowers: 173000,
      avgEngagementRate: 4.0,
      dealTypes: ['paid'] as any,
      minPrice: 1000000,
      maxPrice: 5000000,
      responseTime: 'Within 1 day',
      isVerified: false,
      isTrending: false,
      isFastResponder: false,
      rating: 4.3,
      totalReviews: 28,
      completedDeals: 12,
      contentPreviews: mockCreators[0].contentPreviews,
      createdAt: new Date('2023-05-12'),
    },
    status: 'rejected',
    submittedAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
    verificationSteps: {
      identityVerified: true,
      engagementVerified: false,
      contentReviewPassed: false,
      backgroundCheckPassed: false,
    },
    rejectionReason: 'Does not meet minimum engagement rate requirement (4.0% < 5.0% required). Please reapply after improving engagement metrics.',
  },
];

// Ambassador benefits (Pakistan context)
export const ambassadorBenefits = [
  {
    title: 'Monthly Guaranteed Income',
    description: 'Starting from PKR 1,250,000 per month for qualified ambassadors.',
    icon: '💰',
  },
  {
    title: 'Direct Brand Access',
    description: 'Direct connections with major Pakistani brands and enterprise clients.',
    icon: '🤝',
  },
  {
    title: 'Dedicated Account Manager',
    description: 'Personal account manager based in Karachi or Lahore.',
    icon: '👔',
  },
  {
    title: 'Premium Support',
    description: '24/7 priority support for active ambassadors.',
    icon: '⭐',
  },
  {
    title: 'Performance Bonuses',
    description: 'Performance-based incentive boosts on top campaigns.',
    icon: '🏆',
  },
  {
    title: 'Exclusive Content Opportunities',
    description: 'Exclusive campaigns with high-growth brands across Pakistan.',
    icon: '🎬',
  },
];

