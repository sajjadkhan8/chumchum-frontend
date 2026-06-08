'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { offersService } from '@/services/offers.service';
import type { BrandOfferReaction } from '@/types';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function CreatorOfferReactionsPage() {
  const [reactions, setReactions] = useState<BrandOfferReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const load = useCallback(async (nextPage = 0, append = false) => {
    setIsLoading(true);
    const result = await offersService.getMyReactions(nextPage, 20).catch(() => ({ content: [], totalElements: 0, totalPages: 1, last: true }));
    setReactions(append ? (prev) => [...prev, ...result.content] : result.content);
    setTotalElements(result.totalElements);
    setTotalPages(result.totalPages);
    setPage(nextPage);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  const withdraw = async (reaction: BrandOfferReaction) => {
    try {
      const updated = await offersService.updateCreatorReaction(reaction.offerId, reaction.id, { status: 'WITHDRAWN' });
      setReactions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Reaction withdrawn');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to withdraw reaction');
    }
  };

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold md:text-3xl">My Offer Reactions</h1>
        <p className="text-sm text-muted-foreground">
          {totalElements > 0 ? `${totalElements} reactions submitted` : 'Track how brands respond to your offer submissions.'}
        </p>
      </div>

      {isLoading && reactions.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading reactions…</CardContent></Card>
      ) : reactions.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No reactions yet. Start by responding to brand offers.</CardContent></Card>
      ) : (
        <>
          <div className="space-y-4">
            {reactions.map((reaction) => (
              <Card key={reaction.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{reaction.offerTitle || 'Offer'}</CardTitle>
                      <p className="text-sm text-muted-foreground">{reaction.brandName || 'Brand'}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Badge variant="secondary">{reaction.reactionType}</Badge>
                      <Badge>{reaction.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {reaction.message ? <p className="text-muted-foreground">{reaction.message}</p> : null}
                  {reaction.proposedPrice ? (
                    <p>Proposal: {formatPrice(reaction.proposedPrice)} {reaction.proposedCurrency} • {reaction.proposedDeliveryDays || 'N/A'} days</p>
                  ) : null}
                  {reaction.brandNote ? (
                    <p className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                      <span className="font-medium">Brand note: </span>{reaction.brandNote}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">Updated {formatRelativeTime(reaction.updatedAt)}</p>
                  {(reaction.status === 'submitted' || reaction.status === 'shortlisted' || reaction.status === 'in_review') ? (
                    <Button size="sm" variant="outline" onClick={() => void withdraw(reaction)}>Withdraw</Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
          {page < totalPages - 1 && (
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
