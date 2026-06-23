import type { AmbassadorTier, AmbassadorTierInfo } from '@/types';

/**
 * Ambassador tier presentation metadata (labels, colors, benefits, score ranges).
 *
 * The numeric scoring itself is owned by the backend (single source of truth) and
 * delivered via `ambassadorService.getScore()`. The score ranges / thresholds below
 * MUST match the backend `tierFromScore`: elite >= 80, verified >= 60, emerging >= 40,
 * rising otherwise.
 */
export const AMBASSADOR_TIERS: Record<AmbassadorTier, AmbassadorTierInfo> = {
  rising_creator: {
    tier: 'rising_creator',
    name: '🌱 Rising Creator',
    description: 'Starting your ambassador journey',
    scoreRange: [0, 39],
    icon: '🌱',
    color: '#84cc16', // lime-500
    benefits: ['Early feedback access', 'Growth tips from platform'],
    nextMilestone: 40,
  },
  emerging_ambassador: {
    tier: 'emerging_ambassador',
    name: '🚀 Emerging Ambassador',
    description: 'Building your creator reputation',
    scoreRange: [40, 59],
    icon: '🚀',
    color: '#3b82f6', // blue-500
    benefits: [
      'Priority campaign access',
      'Higher visibility',
      'Creator support line',
      'Monthly bonus opportunities',
    ],
    nextMilestone: 60,
  },
  verified_ambassador: {
    tier: 'verified_ambassador',
    name: '⭐ Verified Ambassador',
    description: 'Trusted creator partner',
    scoreRange: [60, 79],
    icon: '⭐',
    color: '#f59e0b', // amber-500
    benefits: [
      'Guaranteed monthly base pay',
      'Premium brand partnerships',
      'Dedicated account manager',
      'Performance bonuses',
      '24/7 support priority',
    ],
    nextMilestone: 80,
  },
  elite_ambassador: {
    tier: 'elite_ambassador',
    name: '👑 Elite Brand Ambassador',
    description: 'Top-tier platform partner',
    scoreRange: [80, 100],
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
 * Map a backend total score (0-100) to a tier. Thresholds mirror the backend
 * `tierFromScore`: elite >= 80, verified >= 60, emerging >= 40, rising otherwise.
 * Use only for presentation when a tier is not already supplied by the backend.
 */
export function getAmbassadorTier(score: number): AmbassadorTier {
  if (score >= 80) return 'elite_ambassador';
  if (score >= 60) return 'verified_ambassador';
  if (score >= 40) return 'emerging_ambassador';
  return 'rising_creator';
}

/**
 * Build up to three motivational suggestions from backend-supplied metrics.
 * Presentation-only: it summarizes the backend's `improvements`/score, it does not
 * compute its own divergent scoring.
 */
export function getAmbassadorSuggestions(
  total: number,
  tier: AmbassadorTier,
  improvements: string[]
): string[] {
  const suggestions: string[] = [];
  const tierInfo = AMBASSADOR_TIERS[tier];

  if (tier !== 'elite_ambassador' && tierInfo.nextMilestone) {
    const pointsNeeded = tierInfo.nextMilestone - total;
    if (pointsNeeded > 0) {
      suggestions.push(`You need ${pointsNeeded} more points to reach ${getNextTierName(tier)}`);
    }
  }

  for (const improvement of improvements) {
    if (suggestions.length >= 3) break;
    suggestions.push(improvement);
  }

  return suggestions.slice(0, 3);
}

function getNextTierName(currentTier: AmbassadorTier): string {
  const tierNames: Record<AmbassadorTier, string> = {
    rising_creator: 'Emerging Ambassador',
    emerging_ambassador: 'Verified Ambassador',
    verified_ambassador: 'Elite Ambassador',
    elite_ambassador: 'Elite Ambassador',
  };
  return tierNames[currentTier];
}
