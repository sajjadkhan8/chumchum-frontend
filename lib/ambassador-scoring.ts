import type { Creator, AmbassadorScore, AmbassadorTier, AmbassadorTierInfo, CreatorAmbassadorMetrics } from '@/types';

// Ambassador tier definitions
export const AMBASSADOR_TIERS: Record<AmbassadorTier, AmbassadorTierInfo> = {
  rising_creator: {
    tier: 'rising_creator',
    name: '🌱 Rising Creator',
    description: 'Starting your ambassador journey',
    scoreRange: [0, 40],
    icon: '🌱',
    color: '#84cc16', // lime-500
    benefits: ['Early feedback access', 'Growth tips from platform'],
    nextMilestone: 41,
  },
  emerging_ambassador: {
    tier: 'emerging_ambassador',
    name: '🚀 Emerging Ambassador',
    description: 'Building your creator reputation',
    scoreRange: [41, 70],
    icon: '🚀',
    color: '#3b82f6', // blue-500
    benefits: [
      'Priority campaign access',
      'Higher visibility',
      'Creator support line',
      'Monthly bonus opportunities',
    ],
    nextMilestone: 71,
  },
  verified_ambassador: {
    tier: 'verified_ambassador',
    name: '⭐ Verified Ambassador',
    description: 'Trusted creator partner',
    scoreRange: [71, 90],
    icon: '⭐',
    color: '#f59e0b', // amber-500
    benefits: [
      'Guaranteed monthly base pay',
      'Premium brand partnerships',
      'Dedicated account manager',
      'Performance bonuses',
      '24/7 support priority',
    ],
    nextMilestone: 91,
  },
  elite_ambassador: {
    tier: 'elite_ambassador',
    name: '👑 Elite Brand Ambassador',
    description: 'Top-tier platform partner',
    scoreRange: [91, 100],
    icon: '👑',
    color: '#8b5cf6', // purple-500
    benefits: [
      'Premium monthly guarantee',
      'Exclusive campaign access',
      'Direct exec relationship',
      'Custom deal structuring',
      'Content collaboration studio',
      'VIP event invitations',
    ],
    nextMilestone: undefined,
  },
};

/**
 * Calculate ambassador score for a creator
 * Frontend-only calculation using existing creator data
 */
export function calculateAmbassadorScore(creator: Creator): AmbassadorScore {
  // Delivery Score (0-35): Based on completed deals
  const maxDeals = 200; // Benchmark for full score
  const deliveryScore = Math.min((creator.completedDeals / maxDeals) * 35, 35);

  // Account Age Score (0-15): Based on account creation date
  const accountAgeMonths = Math.floor(
    (Date.now() - new Date(creator.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const accountAgeScore = Math.min((accountAgeMonths / 24) * 15, 15); // 24 months = full score

  // Rating Score (0-25): Direct from rating
  const ratingScore = (creator.rating / 5) * 25;

  // Cancellation Score (0-10): Inverse of cancellation rate
  // Assuming 5% cancellation is average: calculation based on deals
  const estimatedCancellationRate = Math.max(0, 5 - Math.floor(creator.rating)); // Rough estimate
  const cancellationScore = Math.max(10 - estimatedCancellationRate * 2, 0);

  // Profile Completeness Score (0-10)
  // Check if profile has: bio, cover image, at least 2 platforms, multiple content previews
  let profileScore = 0;
  if (creator.bio && creator.bio.length > 20) profileScore += 3;
  if (creator.coverImage) profileScore += 3;
  if (creator.platforms.length >= 2) profileScore += 2;
  if (creator.contentPreviews.length >= 6) profileScore += 2;
  profileScore = Math.min(profileScore, 10);

  // Consistency Score (0-5): Based on engagement and response time
  const engagementBonus = creator.avgEngagementRate > 5 ? 3 : 1;
  const responseBonus = creator.responseTime === 'Within 1 hour' ? 2 : 1;
  const consistencyScore = Math.min(engagementBonus + responseBonus, 5);

  const total = Math.min(
    Math.round(deliveryScore + accountAgeScore + ratingScore + cancellationScore + profileScore + consistencyScore),
    100
  );

  return {
    total,
    deliveryScore: Math.round(deliveryScore),
    accountAgeScore: Math.round(accountAgeScore),
    ratingScore: Math.round(ratingScore),
    cancellationScore: Math.round(cancellationScore),
    profileCompletenessScore: Math.round(profileScore),
    consistencyScore: Math.round(consistencyScore),
  };
}

/**
 * Get ambassador tier based on score
 */
export function getAmbassadorTier(score: number): AmbassadorTier {
  if (score >= 91) return 'elite_ambassador';
  if (score >= 71) return 'verified_ambassador';
  if (score >= 41) return 'emerging_ambassador';
  return 'rising_creator';
}

/**
 * Get percentile rank (where creator stands vs others)
 * Frontend simulation: Use a mock distribution
 */
export function getPercentileRank(score: number): number {
  // Simulated distribution: most creators are in 30-60 range
  const distribution = [
    { score: 0, percentile: 5 },
    { score: 20, percentile: 20 },
    { score: 40, percentile: 40 },
    { score: 60, percentile: 65 },
    { score: 75, percentile: 82 },
    { score: 85, percentile: 92 },
    { score: 95, percentile: 98 },
    { score: 100, percentile: 100 },
  ];

  for (let i = 0; i < distribution.length - 1; i++) {
    const curr = distribution[i];
    const next = distribution[i + 1];
    if (score >= curr.score && score <= next.score) {
      const ratio = (score - curr.score) / (next.score - curr.score);
      return Math.round(curr.percentile + (next.percentile - curr.percentile) * ratio);
    }
  }
  return 100;
}

/**
 * Calculate strengths and improvements for creator
 */
export function getCreatorInsights(
  creator: Creator,
  score: AmbassadorScore
): { strengths: string[]; improvements: string[] } {
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Strengths
  if (score.deliveryScore >= 25) strengths.push('Excellent delivery track record');
  if (score.ratingScore >= 20) strengths.push('Consistently high-quality work');
  if (score.accountAgeScore >= 10) strengths.push('Long-term platform member');
  if (creator.avgEngagementRate >= 5) strengths.push('Strong audience engagement');
  if (creator.isFastResponder) strengths.push('Responsive to brand inquiries');

  // Improvements
  if (score.deliveryScore < 20) improvements.push(`Complete ${20 - Math.floor(score.deliveryScore / 1.75)} more deliveries to boost score`);
  if (score.ratingScore < 20) improvements.push('Aim for 4.8+ rating to enhance quality score');
  if (creator.completedDeals < 30) improvements.push('Build up to 30+ completed deals for stability');
  if (score.profileCompletenessScore < 8) improvements.push('Add cover image and complete bio for better profile');
  if (creator.platforms.length < 3) improvements.push('Expand to 3+ social platforms for broader reach');

  return { strengths, improvements };
}

/**
 * Generate journey milestones (mock data based on creation date and deals)
 */
export function getJourneyMilestones(creator: Creator) {
  return {
    joinedPlatform: creator.createdAt,
    firstDelivery: new Date(creator.createdAt.getTime() + 1000 * 60 * 60 * 24 * 15), // ~15 days after joining
    consistencyAchieved:
      creator.completedDeals >= 10
        ? new Date(creator.createdAt.getTime() + 1000 * 60 * 60 * 24 * 60)
        : undefined, // ~60 days after joining
    ambassadorEligible:
      creator.completedDeals >= 30 && creator.rating >= 4.5
        ? new Date(creator.createdAt.getTime() + 1000 * 60 * 60 * 24 * 90)
        : undefined, // ~90 days after joining
  };
}

/**
 * Generate complete ambassador metrics for a creator
 */
export function calculateCreatorAmbassadorMetrics(creator: Creator): CreatorAmbassadorMetrics {
  const score = calculateAmbassadorScore(creator);
  const tier = getAmbassadorTier(score.total);
  const percentileRank = getPercentileRank(score.total);
  const { strengths, improvements } = getCreatorInsights(creator, score);
  const journeyMilestones = getJourneyMilestones(creator);

  return {
    creatorId: creator.id,
    score,
    tier,
    percentileRank,
    strengths,
    improvements,
    journeyMilestones,
  };
}

/**
 * Get motivational suggestions for improvement
 */
export function getAmbasadorSuggestions(metrics: CreatorAmbassadorMetrics, tier: AmbassadorTier): string[] {
  const suggestions: string[] = [];
  const tierInfo = AMBASSADOR_TIERS[tier];
  const nextTier = tier === 'elite_ambassador' ? undefined : getNextTierName(tier);

  if (tier !== 'elite_ambassador' && tierInfo.nextMilestone) {
    const pointsNeeded = tierInfo.nextMilestone - metrics.score.total;
    if (pointsNeeded > 0) {
      suggestions.push(`You need ${pointsNeeded} more points to reach ${nextTier}`);
    }
  }

  // Specific actionable suggestions
  if (metrics.score.deliveryScore < 30) {
    const dealsNeeded = Math.ceil((30 - metrics.score.deliveryScore) / 0.175);
    suggestions.push(`Complete ${dealsNeeded} more deliveries to boost score significantly`);
  }

  if (metrics.score.ratingScore < 24) {
    suggestions.push('Maintain 4.8+ star rating to maximize quality score');
  }

  if (metrics.score.profileCompletenessScore < 10) {
    suggestions.push('Complete your profile for instant trust boost');
  }

  if (!metrics.improvements.some(i => i.includes('30+'))) {
    suggestions.push('Reach 30 completed deliveries for stability tier');
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
}

function getNextTierName(currentTier: AmbassadorTier): string {
  const tierNames = {
    rising_creator: 'Emerging Ambassador',
    emerging_ambassador: 'Verified Ambassador',
    verified_ambassador: 'Elite Ambassador',
    elite_ambassador: 'Elite Ambassador',
  };
  return tierNames[currentTier];
}

