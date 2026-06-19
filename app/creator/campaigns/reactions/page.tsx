'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, MessageSquare, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreatorMetricCard } from '@/components/creator-metric-card';
import { campaignsService } from '@/services/campaigns.service';
import type { BrandCampaignReaction } from '@/types';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

const panelClass =
  'rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]';

function reactionTypeBadge(type: string) {
  const map: Record<string, string> = {
    interested: 'bg-[#e4f1e8] text-[#1e5c3e]',
    proposal: 'bg-[#dde8f8] text-[#2a5097]',
    question: 'bg-[#fdf3dc] text-[#8a6010]',
    decline: 'bg-[#fce8e6] text-[#8b2a22]',
  };
  return map[type?.toLowerCase()] ?? 'bg-[#e8eae8] text-[#5a6a62]';
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    submitted: 'bg-[#fdf3dc] text-[#8a6010]',
    in_review: 'bg-[#fdf3dc] text-[#8a6010]',
    shortlisted: 'bg-[#e0edff] text-[#1e4db7]',
    accepted: 'bg-[#e4f1e8] text-[#1e5c3e]',
    rejected: 'bg-[#fce8e6] text-[#8b2a22]',
    withdrawn: 'bg-[#fce8e6] text-[#8b2a22]',
  };
  return map[status?.toLowerCase()] ?? 'bg-[#e8eae8] text-[#5a6a62]';
}

const canWithdraw = (status: string) =>
  ['submitted', 'shortlisted', 'in_review'].includes(status?.toLowerCase());

export default function CreatorCampaignReactionsPage() {
  const [reactions, setReactions] = useState<BrandCampaignReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const load = useCallback(async (nextPage = 0, append = false) => {
    setIsLoading(true);
    const result = await campaignsService
      .getMyReactions(nextPage, 20)
      .catch(() => ({ content: [], totalElements: 0, totalPages: 1, last: true }));
    setReactions(append ? (prev) => [...prev, ...result.content] : result.content);
    setTotalElements(result.totalElements);
    setTotalPages(result.totalPages);
    setPage(nextPage);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  const analytics = useMemo(() => {
    if (reactions.length === 0) return null;
    const total = reactions.length;
    const accepted = reactions.filter((r) => r.status?.toLowerCase() === 'accepted').length;
    const shortlisted = reactions.filter((r) => r.status?.toLowerCase() === 'shortlisted').length;
    const rejected = reactions.filter((r) => r.status?.toLowerCase() === 'rejected').length;
    const responded = accepted + shortlisted + rejected;
    const activeTotal = reactions.filter((r) => r.status?.toLowerCase() !== 'withdrawn').length;
    const typeCounts = (['interested', 'proposal', 'question', 'decline'] as const).map((type) => ({
      type,
      count: reactions.filter((r) => r.reactionType?.toLowerCase() === type).length,
    }));
    return {
      total,
      acceptanceRate: activeTotal > 0 ? Math.round((accepted / activeTotal) * 100) : 0,
      shortlistRate: activeTotal > 0 ? Math.round((shortlisted / activeTotal) * 100) : 0,
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      typeCounts,
    };
  }, [reactions]);

  const withdraw = async (reaction: BrandCampaignReaction) => {
    if (reaction.status === 'withdrawn') return;
    setReactions((prev) => prev.map((item) => (item.id === reaction.id ? { ...item, status: 'withdrawn' as BrandCampaignReaction['status'] } : item)));
    try {
      const updated = await campaignsService.updateCreatorReaction(reaction.campaignId, reaction.id, {
        status: 'WITHDRAWN',
      });
      setReactions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Reaction withdrawn');
    } catch (error) {
      setReactions((prev) => prev.map((item) => (item.id === reaction.id ? reaction : item)));
      toast.error(error instanceof Error ? error.message : 'Failed to withdraw reaction');
    }
  };

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-8 pt-2 text-[#1e3d2e] sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1320px] space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">
              MY ACTIVITY
            </p>
            <h1 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#1e3d2e]">
              Campaign reactions
            </h1>
          </div>
          <Link
            href="/creator/campaigns"
            className="flex items-center gap-1.5 rounded-full border border-[#d1ddd6] bg-white px-4 py-2 text-sm font-bold text-[#2d6b4e] transition-colors hover:bg-[#e6eceb]"
          >
            <ArrowLeft className="h-4 w-4" />
            Campaigns
          </Link>
        </div>

        {/* ── Stat strip ── */}
        {(() => {
          const pending = reactions.filter((r) => ['submitted', 'in_review'].includes(r.status?.toLowerCase())).length;
          const shortlisted = reactions.filter((r) => r.status?.toLowerCase() === 'shortlisted').length;
          const accepted = reactions.filter((r) => r.status?.toLowerCase() === 'accepted').length;
          return (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <CreatorMetricCard dark title="Total" value={totalElements} sub="responses sent" Icon={MessageSquare} />
              <CreatorMetricCard title="Pending" value={pending} sub="submitted or in review" Icon={Clock} />
              <CreatorMetricCard title="Shortlisted" value={shortlisted} sub="brand is considering" Icon={Star} />
              <CreatorMetricCard gold title="Accepted" value={accepted} sub="approved reactions" Icon={CheckCircle} />
            </div>
          );
        })()}

        {/* Proposal Performance */}
        {analytics && (
          <div className={`${panelClass} p-5`}>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-[#2d6b4e]" />
              <h2 className="text-sm font-extrabold tracking-[-0.02em] text-[#1e3d2e]">
                Proposal Performance
              </h2>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] text-[#87938b]">
                Based on {analytics.total} reaction{analytics.total !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Rate bars */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Acceptance rate', value: analytics.acceptanceRate, color: '#2d6b4e', bg: '#e4f1e8' },
                { label: 'Shortlist rate', value: analytics.shortlistRate, color: '#1e4db7', bg: '#e0edff' },
                { label: 'Response rate', value: analytics.responseRate, color: '#b77a12', bg: '#fdf3dc' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="rounded-xl p-3" style={{ backgroundColor: bg }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color }}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-2xl font-extrabold tracking-[-0.03em]" style={{ color }}>
                    {value}%
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/60">
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${value}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Type breakdown */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {analytics.typeCounts.map(({ type, count }) => (
                <div key={type} className="rounded-xl border border-[#e8eeeb] bg-[#f7f9f8] p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#87938b]">
                    {type}
                  </p>
                  <p className="mt-0.5 text-lg font-extrabold text-[#1e3d2e]">{count}</p>
                  <div className="mt-1 h-1 w-full rounded-full bg-[#e8eeeb]">
                    <div
                      className="h-1 rounded-full bg-[#2d6b4e] transition-all duration-700"
                      style={{ width: analytics.total > 0 ? `${Math.round((count / analytics.total) * 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && reactions.length === 0 && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`${panelClass} overflow-hidden`}>
                <div className="animate-pulse px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-48 rounded-lg bg-[#e8eeeb]" />
                      <div className="h-3 w-28 rounded-lg bg-[#e8eeeb]" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-20 rounded-full bg-[#e8eeeb]" />
                      <div className="h-6 w-20 rounded-full bg-[#e8eeeb]" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full rounded-lg bg-[#e8eeeb]" />
                    <div className="h-3 w-2/3 rounded-lg bg-[#e8eeeb]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && reactions.length === 0 && (
          <div className={`${panelClass} flex flex-col items-center justify-center py-16 text-center`}>
            <MessageSquare className="size-10 text-[#c2d8cb]" />
            <p className="mt-4 text-base font-extrabold tracking-[-0.02em] text-[#1e3d2e]">
              No reactions yet
            </p>
            <p className="mt-1.5 max-w-xs text-sm text-[#87938b]">
              React to brand campaigns to see your responses here.
            </p>
            <Link
              href="/creator/campaigns"
              className="mt-6 rounded-full bg-[#2d6b4e] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
            >
              Browse campaigns
            </Link>
          </div>
        )}

        {/* Reaction cards */}
        {reactions.length > 0 && (
          <>
            <div className="space-y-4">
              {reactions.map((reaction, idx) => (
                <motion.div
                  key={reaction.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: idx * 0.04 }}
                  className={`${panelClass} overflow-hidden`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#e8eeeb] px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-extrabold leading-snug text-[#1e3d2e]">
                        {reaction.campaignTitle || 'Campaign'}
                      </p>
                      <p className="mt-0.5 text-xs text-[#87938b]">{reaction.brandName || 'Brand'}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${reactionTypeBadge(reaction.reactionType)}`}
                      >
                        {reaction.reactionType}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusBadge(reaction.status)}`}
                      >
                        {reaction.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="space-y-2.5 px-5 py-4">
                    {reaction.message ? (
                      <p className="text-sm text-[#6b7870]">{reaction.message}</p>
                    ) : null}

                    {reaction.proposedPrice ? (
                      <div className="rounded-xl bg-[#f4f7f5] px-4 py-3">
                        <p className="mb-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#87938b]">
                          Proposed
                        </p>
                        <p className="text-base font-extrabold text-[#1e3d2e]">
                          {formatPrice(reaction.proposedPrice)}{' '}
                          <span className="text-sm font-bold text-[#87938b]">
                            {reaction.proposedCurrency}
                          </span>
                        </p>
                        {reaction.proposedDeliveryDays ? (
                          <p className="mt-0.5 text-xs text-[#87938b]">
                            {reaction.proposedDeliveryDays} days delivery
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {reaction.brandNote ? (
                      <div className="rounded-xl bg-[#fdf3dc] px-4 py-3 text-sm text-[#73541e]">
                        <span className="font-bold">Brand note: </span>
                        <span className="italic">{reaction.brandNote}</span>
                      </div>
                    ) : null}

                    <p className="text-xs text-[#87938b]">
                      Updated {formatRelativeTime(reaction.updatedAt)}
                    </p>

                    {canWithdraw(reaction.status) ? (
                      <button
                        onClick={() => void withdraw(reaction)}
                        className="rounded-full border border-[#d1ddd6] px-4 py-1.5 text-xs font-bold text-[#6b7870] transition-colors hover:border-[#c0392b] hover:text-[#c0392b]"
                      >
                        Withdraw
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Load more */}
            {page < totalPages - 1 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => void load(page + 1, true)}
                  disabled={isLoading}
                  className="rounded-full border border-[#d1ddd6] bg-white px-6 py-2.5 text-sm font-bold text-[#2d6b4e] transition-colors hover:bg-[#e6eceb] disabled:opacity-50"
                >
                  {isLoading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

