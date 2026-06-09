'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { offersService } from '@/services/offers.service';
import type { BrandOffer, BrandOfferReaction, BrandOfferStatus } from '@/types';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

const statusActions: Partial<Record<BrandOfferStatus, Array<{ label: string; next: Uppercase<BrandOfferStatus> }>>> = {
  draft: [{ label: 'Publish', next: 'PUBLISHED' }],
  published: [
    { label: 'Pause', next: 'PAUSED' },
    { label: 'Close', next: 'CLOSED' },
  ],
  paused: [
    { label: 'Re-publish', next: 'PUBLISHED' },
    { label: 'Close', next: 'CLOSED' },
  ],
  closed: [{ label: 'Archive', next: 'ARCHIVED' }],
};

export default function BrandOfferDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const offerId = params.id;

  const [offer, setOffer] = useState<BrandOffer | null>(null);
  const [reactions, setReactions] = useState<BrandOfferReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // inbox filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [reactionPage, setReactionPage] = useState(0);
  const [reactionTotalPages, setReactionTotalPages] = useState(1);

  const [actioningReactionId, setActioningReactionId] = useState<string | null>(null);
  const [reactionNotes, setReactionNotes] = useState<Record<string, string>>({});

  const loadOffer = useCallback(async () => {
    const result = await offersService.getBrandOffer(offerId).catch(() => null);
    setOffer(result);
  }, [offerId]);

  const loadReactions = useCallback(async (nextPage = 0, append = false) => {
    const result = await offersService.getOfferReactions(offerId, {
      status: statusFilter || undefined,
      reactionType: typeFilter || undefined,
      page: nextPage,
      size: 20,
    }).catch(() => ({ content: [], totalElements: 0, totalPages: 1, last: true }));
    setReactions(append ? (prev) => [...prev, ...result.content] : result.content);
    setReactionTotalPages(result.totalPages);
    setReactionPage(nextPage);
  }, [offerId, statusFilter, typeFilter]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      await Promise.all([loadOffer(), loadReactions(0)]);
      setIsLoading(false);
    };
    void run();
  }, [loadOffer, loadReactions]);

  const reactionCounts = useMemo(() => {
    return reactions.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }, [reactions]);

  const onStatusChange = async (next: Uppercase<BrandOfferStatus>) => {
    try {
      const updated = await offersService.updateOfferStatus(offerId, next);
      setOffer(updated);
      toast.success('Offer status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const onReactionAction = async (reactionId: string, action: 'SHORTLIST' | 'REVIEW' | 'ACCEPT' | 'REJECT') => {
    setActioningReactionId(reactionId);
    try {
      const updated = await offersService.actionReaction(offerId, reactionId, action, reactionNotes[reactionId]);
      setReactions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(`Reaction ${action.toLowerCase()}ed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update reaction');
    } finally {
      setActioningReactionId(null);
    }
  };

  if (isLoading || !offer) {
    return (
      <div className="container mx-auto p-4 pb-6 md:p-6">
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading offer…</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{offer.title}</h1>
          <p className="text-sm text-muted-foreground">{offer.offerType} • Updated {formatRelativeTime(offer.updatedAt)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/brand/offers')}>Back</Button>
          {statusActions[offer.status]?.map((entry) => (
            <Button key={entry.next} onClick={() => void onStatusChange(entry.next)}>{entry.label}</Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Offer Brief</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{offer.brief}</p>
            <p><span className="font-medium">Budget:</span> {formatPrice(offer.budgetMin)} – {formatPrice(offer.budgetMax)} {offer.currency}</p>
            {offer.targetPlatforms ? <p><span className="font-medium">Platforms:</span> {offer.targetPlatforms}</p> : null}
            {offer.contentFormats ? <p><span className="font-medium">Formats:</span> {offer.contentFormats}</p> : null}
            {offer.deadlineDate ? <p><span className="font-medium">Deadline:</span> {offer.deadlineDate}</p> : null}
            {offer.deliverables ? <p><span className="font-medium">Deliverables:</span> {offer.deliverables}</p> : null}
            {offer.requirements ? <p><span className="font-medium">Requirements:</span> {offer.requirements}</p> : null}
            {offer.tags ? <p><span className="font-medium">Tags:</span> {offer.tags}</p> : null}
            {offer.referenceUrls ? <p><span className="font-medium">References:</span> {offer.referenceUrls}</p> : null}
            {offer.minFollowers ? <p><span className="font-medium">Min followers:</span> {offer.minFollowers.toLocaleString()}</p> : null}
            <p><span className="font-medium">Target:</span> {offer.targetCity || 'Any city'} • {offer.targetLanguage || 'Any language'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Responses</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Total:</span> {reactions.length}</p>
            <p>Submitted: {reactionCounts.submitted || 0}</p>
            <p>Shortlisted: {reactionCounts.shortlisted || 0}</p>
            <p>In Review: {reactionCounts.in_review || 0}</p>
            <p>Accepted: {reactionCounts.accepted || 0}</p>
            <p>Rejected: {reactionCounts.rejected || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reaction inbox */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Creator Reactions</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {['SUBMITTED', 'SHORTLISTED', 'IN_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {['INTERESTED', 'PROPOSAL', 'QUESTION', 'DECLINE'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-8" onClick={() => void loadReactions(0)}>Apply</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reactions match your filters yet.</p>
          ) : (
            <>
              <div className="space-y-4">
                {reactions.map((reaction) => (
                  <div key={reaction.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Link className="font-medium hover:underline" href={`/creator/${reaction.creatorId}`}>
                        {reaction.creatorName}
                      </Link>
                      <Badge variant="secondary">{reaction.reactionType}</Badge>
                      <Badge>{reaction.status.replace('_', ' ')}</Badge>
                    </div>
                    {reaction.message ? <p className="text-sm text-muted-foreground">{reaction.message}</p> : null}
                    {(reaction.proposedPrice || reaction.proposedDeliveryDays) ? (
                      <p className="mt-2 text-sm">
                        Proposal: {reaction.proposedPrice ? `${formatPrice(reaction.proposedPrice)} ${reaction.proposedCurrency}` : 'N/A'}
                        {' '}&bull;{' '}
                        {reaction.proposedDeliveryDays ? `${reaction.proposedDeliveryDays} days` : 'No timeline'}
                      </p>
                    ) : null}
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Textarea
                        rows={2}
                        placeholder="Optional note for creator"
                        value={reactionNotes[reaction.id] || ''}
                        onChange={(event) => setReactionNotes((prev) => ({ ...prev, [reaction.id]: event.target.value }))}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'SHORTLIST')}>Shortlist</Button>
                        <Button size="sm" variant="outline" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'REVIEW')}>Review</Button>
                        <Button size="sm" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'ACCEPT')}>Accept</Button>
                        <Button size="sm" variant="destructive" disabled={actioningReactionId === reaction.id} onClick={() => void onReactionAction(reaction.id, 'REJECT')}>Reject</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {reactionPage < reactionTotalPages - 1 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" onClick={() => void loadReactions(reactionPage + 1, true)}>
                    Load more reactions
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
