'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import type { Creator } from '@/types';
import { formatFollowers } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ambassadorService } from '@/services/ambassador.service';

interface EligibilityRequirements {
  minFollowers: number;
  minEngagementRate: number;
  minRating: number;
  minCompletedDeals: number;
  verificationSteps: string[];
}

const defaultRequirements: EligibilityRequirements = {
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

interface AmbassadorEligibilityCheckerProps {
  creator: Creator;
  className?: string;
}

export function AmbassadorEligibilityChecker({ creator, className }: AmbassadorEligibilityCheckerProps) {
  const [reqs, setReqs] = useState<EligibilityRequirements>(defaultRequirements);

  useEffect(() => {
    const loadRequirements = async () => {
      const response = await ambassadorService.getEligibilityRequirements();
      setReqs(response);
    };

    void loadRequirements();
  }, []);

  const meetsFollowersRequirement = creator.totalFollowers >= reqs.minFollowers;
  const meetsEngagementRequirement = creator.avgEngagementRate >= reqs.minEngagementRate;
  const meetsRatingRequirement = creator.rating >= reqs.minRating;
  const meetsDealsRequirement = creator.completedDeals >= reqs.minCompletedDeals;

  const allRequirementsMet =
    meetsFollowersRequirement &&
    meetsEngagementRequirement &&
    meetsRatingRequirement &&
    meetsDealsRequirement;

  const metCount = [meetsFollowersRequirement, meetsEngagementRequirement, meetsRatingRequirement, meetsDealsRequirement].filter(Boolean).length;

  const requirements = [
    {
      title: 'Minimum Followers',
      description: `Need at least ${formatFollowers(reqs.minFollowers)} followers across all platforms`,
      current: formatFollowers(creator.totalFollowers),
      met: meetsFollowersRequirement,
      icon: '👥',
    },
    {
      title: 'Engagement Rate',
      description: `Minimum ${reqs.minEngagementRate}% average engagement rate`,
      current: `${creator.avgEngagementRate}%`,
      met: meetsEngagementRequirement,
      icon: '📊',
    },
    {
      title: 'Minimum Rating',
      description: `Minimum ${reqs.minRating} star rating from completed deals`,
      current: `${creator.rating} ⭐`,
      met: meetsRatingRequirement,
      icon: '⭐',
    },
    {
      title: 'Completed Deals',
      description: `At least ${reqs.minCompletedDeals} successfully completed campaigns`,
      current: `${creator.completedDeals} deals`,
      met: meetsDealsRequirement,
      icon: '✅',
    },
  ];

  return (
    <div
      className={cn(
        'rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)] p-5 sm:p-6',
        className
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Eligibility</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">
            Ambassador Eligibility Check
          </h2>
          <p className="mt-1 text-xs text-[#87938b]">
            Platform Ambassadors are verified creators who receive guaranteed monthly income and exclusive brand partnerships.
          </p>
        </div>
        {allRequirementsMet ? (
          <span className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#2d6b4e] px-3 py-1.5 text-xs font-bold text-white">
            <Check className="size-3" />
            Qualified
          </span>
        ) : (
          <span className="flex-shrink-0 rounded-full border border-[#d1ddd6] bg-[#f4f7f5] px-3 py-1.5 text-xs font-bold text-[#87938b]">
            {metCount}/4
          </span>
        )}
      </div>

      {/* Progress alert */}
      {!allRequirementsMet && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#e8c98a] bg-[#fdf3dc] p-3.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#9b6712]" />
          <p className="text-xs leading-5 text-[#73541e]">
            You don't meet all requirements yet, but you're making progress! Keep improving and check back soon.
          </p>
        </div>
      )}

      {/* Requirements list */}
      <div className="space-y-3">
        {requirements.map((req) => (
          <div
            key={req.title}
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-3.5 transition-colors',
              req.met
                ? 'border-[#c2dac9] bg-[#f0f9f4]'
                : 'border-[#d1ddd6] bg-[#f9f9f6]'
            )}
          >
            <div className="text-2xl">{req.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-[#1e3d2e]">{req.title}</p>
              <p className="text-xs text-[#87938b]">{req.description}</p>
              <p className={cn('mt-1 text-sm font-bold', req.met ? 'text-[#2d6b4e]' : 'text-[#87938b]')}>
                Current: {req.current}
              </p>
            </div>
            <div className="flex-shrink-0">
              {req.met ? (
                <Check className="size-5 text-[#2d6b4e]" />
              ) : (
                <X className="size-5 text-[#87938b]" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Qualified banner */}
      {allRequirementsMet && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#c2dac9] bg-[#e4f1e8] p-3.5">
          <Check className="mt-0.5 size-4 shrink-0 text-[#2d6b4e]" />
          <p className="text-sm text-[#1e5c3e]">
            🎉 Congratulations! You meet all requirements and can apply for the Platform Ambassador program.
          </p>
        </div>
      )}

      {/* Verification steps */}
      {reqs.verificationSteps && (
        <div className="mt-5 border-t border-[#edf1ed] pt-5">
          <h4 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[#7a8f82]">
            Verification Process
          </h4>
          <ol className="space-y-2">
            {reqs.verificationSteps.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-[#87938b]">
                <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-[#e4f1e8] text-xs font-extrabold text-[#2d6b4e]">
                  {idx + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
