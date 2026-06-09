'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { offersService } from '@/services/offers.service';
import type { BrandOffer } from '@/types';
import { formatPrice } from '@/lib/utils';

export default function CreatorOfferDetailPage() {
  const params = useParams<{ id: string }>();
  const [offer, setOffer] = useState<BrandOffer | null>(null);

  useEffect(() => {
    void offersService.getCreatorOffer(params.id).then(setOffer).catch(() => setOffer(null));
  }, [params.id]);

  if (!offer) {
    return (
      <div className="container mx-auto p-4 pb-6 md:p-6">
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Offer not available.</CardContent></Card>
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
          {offer.campaignGoal ? <p><span className="font-medium">Campaign goal:</span> {offer.campaignGoal}</p> : null}
          {offer.targetPlatforms ? <p><span className="font-medium">Platforms:</span> {offer.targetPlatforms}</p> : null}
          {offer.contentFormats ? <p><span className="font-medium">Formats:</span> {offer.contentFormats}</p> : null}
          {offer.deliverables ? <p><span className="font-medium">Deliverables:</span> {offer.deliverables}</p> : null}
          {offer.requirements ? <p><span className="font-medium">Requirements:</span> {offer.requirements}</p> : null}
          <p><span className="font-medium">Target:</span> {offer.targetCity || 'Any city'} • {offer.targetLanguage || 'Any language'}</p>
          <p><span className="font-medium">Deadline:</span> {offer.deadlineDate || 'Open'}</p>
        </CardContent>
      </Card>
    </div>
  );
}

