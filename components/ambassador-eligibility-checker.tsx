'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    <Card className={cn('border-border/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ambassador Eligibility Check</span>
          {allRequirementsMet ? (
            <Badge className="bg-primary/90 text-primary-foreground">
              <Check className="mr-1 h-3 w-3" />
              Qualified
            </Badge>
          ) : (
            <Badge variant="secondary">
              {[meetsFollowersRequirement, meetsEngagementRequirement, meetsRatingRequirement, meetsDealsRequirement].filter(Boolean).length}/{requirements.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Platform Ambassadors are verified creators who receive guaranteed monthly income and exclusive brand partnerships.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!allRequirementsMet && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't meet all requirements yet, but you're making progress! Keep improving and check back soon.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {requirements.map((req) => (
            <div key={req.title} className={cn(
              'flex items-start gap-3 rounded-lg border p-3 transition-colors',
              req.met
                ? 'border-border/50 bg-background'
                : 'border-border/50 bg-muted/30'
            )}>
              <div className="text-2xl">{req.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{req.title}</p>
                <p className="text-xs text-muted-foreground">{req.description}</p>
                <p className={cn(
                  'mt-1 text-sm font-medium',
                  req.met ? 'text-primary' : 'text-muted-foreground'
                )}>
                  Current: {req.current}
                </p>
              </div>
              <div className="flex-shrink-0">
                {req.met ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>

        {allRequirementsMet && (
          <Alert className="bg-primary/10 border-primary/20">
            <Check className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              🎉 Congratulations! You meet all requirements and can apply for the Platform Ambassador program.
            </AlertDescription>
          </Alert>
        )}

        {reqs.verificationSteps && (
          <div className="border-t border-border pt-4">
            <h4 className="mb-3 font-semibold text-sm">Verification Process</h4>
            <ol className="space-y-2">
              {reqs.verificationSteps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

