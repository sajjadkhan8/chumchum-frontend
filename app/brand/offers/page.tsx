'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignGoalBadge } from '@/components/campaign-goal-badge';
import { offersService } from '@/services/offers.service';
import type { BrandOffer, BrandOfferStatus } from '@/types';
import { formatPrice, formatRelativeTime } from '@/lib/utils';

const statusTabs: Array<{ value: 'all' | BrandOfferStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

const statusClass = (status: BrandOfferStatus) => {
  if (status === 'published') return 'bg-green-100 text-green-700';
  if (status === 'draft') return 'bg-yellow-100 text-yellow-700';
  if (status === 'paused') return 'bg-orange-100 text-orange-700';
  if (status === 'closed') return 'bg-slate-200 text-slate-700';
  return 'bg-muted text-muted-foreground';
};

const referencesScore = (offer: BrandOffer) => {
  const checks = [
    offer.keyMessage,
    offer.dosAndDonts,
    offer.hashtagsMentions,
    offer.referenceUrls,
    offer.usageRights,
    offer.termsAndConditions,
    offer.expectedOutcomes,
  ];
  return checks.filter((value) => Boolean(value && value.trim().length > 0)).length;
};

export default function BrandOffersPage() {
  const [offers, setOffers] = useState<BrandOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | BrandOfferStatus>('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const load = useCallback(async (nextPage = 0, append = false) => {
    setIsLoading(true);
    const result = await offersService.getBrandOffers(nextPage, 20).catch(() => ({ content: [], totalElements: 0, totalPages: 1, last: true }));
    setOffers(append ? (prev) => [...prev, ...result.content] : result.content);
    setTotalElements(result.totalElements);
    setTotalPages(result.totalPages);
    setPage(nextPage);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return offers;
    return offers.filter((item) => item.status === activeTab);
  }, [activeTab, offers]);

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Brand Offers</h1>
          <p className="text-sm text-muted-foreground">
            {totalElements > 0 ? `${totalElements} offers total` : 'Publish custom requirements and let creators come to you.'}
          </p>
        </div>
        <Button asChild>
          <Link href="/brand/offers/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Offer
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading && offers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading offers…</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No offers in this status yet.</CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {filtered.map((offer) => (
              <Card key={offer.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{offer.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{offer.offerType} • {offer.targetCity || 'Pakistan-wide'}</p>
                    </div>
                    <Badge className={statusClass(offer.status)}>{offer.status.replace('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{offer.brief}</p>
                  {offer.campaignGoal ? <CampaignGoalBadge goal={offer.campaignGoal} /> : null}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span className="font-medium text-primary">
                      {formatPrice(offer.budgetMin)} – {formatPrice(offer.budgetMax)} {offer.currency}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {offer.reactionCount} reactions
                    </span>
                    <span className="text-muted-foreground">Updated {formatRelativeTime(offer.updatedAt)}</span>
                    <Badge variant="outline">Refs {referencesScore(offer)}/7</Badge>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/brand/offers/${offer.id}`}>Manage Offer</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {page < totalPages - 1 && activeTab === 'all' && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => void load(page + 1, true)} disabled={isLoading}>
                {isLoading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
