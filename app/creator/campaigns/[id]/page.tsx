'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CampaignGoalBadge } from '@/components/campaign-goal-badge';
import { campaignsService } from '@/services/campaigns.service';
import type { BrandCampaign } from '@/types';
import { formatPrice } from '@/lib/utils';

const locationLabel = (offer: BrandCampaign) => {
  const locationMode = offer.locationTargetingMode;
  const targetRegion = offer.targetRegion;
  const targetCities = offer.targetCities;

  if (locationMode === 'remote_only') return 'Remote / Online only';
  if (locationMode === 'region') return targetRegion || offer.targetCity || 'Region';
  if (locationMode === 'cities') return targetCities || offer.targetCity || 'Selected cities';
  return offer.targetCity || 'Nationwide';
};

export default function CreatorCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const [offer, setOffer] = useState<BrandCampaign | null>(null);

  useEffect(() => {
    void campaignsService.getCreatorCampaign(params.id).then(setOffer).catch(() => setOffer(null));
  }, [params.id]);

  if (!offer) {
    return (
      <div className="container mx-auto p-4 pb-6 md:p-6">
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Campaign not available.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{offer.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{offer.brandName} • {offer.offerType}</p>
            </div>
            <Badge>{offer.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{offer.brief}</p>
          <p><span className="font-medium">Budget:</span> {formatPrice(offer.budgetMin)} - {formatPrice(offer.budgetMax)} {offer.currency}</p>
          {offer.campaignGoal ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Campaign goal:</span>
              <CampaignGoalBadge goal={offer.campaignGoal} />
            </div>
          ) : null}
          {offer.targetPlatforms ? <p><span className="font-medium">Platforms:</span> {offer.targetPlatforms}</p> : null}
          {offer.contentFormats ? <p><span className="font-medium">Formats:</span> {offer.contentFormats}</p> : null}
          {offer.deliverables ? <p><span className="font-medium">Deliverables:</span> {offer.deliverables}</p> : null}
          {offer.keyMessage ? <p><span className="font-medium">Key message:</span> {offer.keyMessage}</p> : null}
          {offer.dosAndDonts ? <p><span className="font-medium">Do's and don'ts:</span> {offer.dosAndDonts}</p> : null}
          {offer.hashtagsMentions ? <p><span className="font-medium">Hashtags & mentions:</span> {offer.hashtagsMentions}</p> : null}
          {offer.referenceUrls ? <p><span className="font-medium">Reference content:</span> {offer.referenceUrls}</p> : null}
          {offer.usageRights ? <p><span className="font-medium">Usage rights:</span> {offer.usageRights}</p> : null}
          {offer.termsAndConditions ? <p><span className="font-medium">Terms & conditions:</span> {offer.termsAndConditions}</p> : null}
          {offer.expectedOutcomes ? <p><span className="font-medium">Expected outcomes:</span> {offer.expectedOutcomes}</p> : null}
          <p><span className="font-medium">Target:</span> {locationLabel(offer)} • {offer.targetLanguage || 'Any language'}</p>
          <p><span className="font-medium">Deadline:</span> {offer.deadlineDate || 'Open'}</p>
        </CardContent>
      </Card>
    </div>
  );
}

