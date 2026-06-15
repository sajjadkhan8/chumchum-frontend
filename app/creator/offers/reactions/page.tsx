'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, MessageSquare, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { offersService } from '@/services/offers.service';
import type { BrandOfferReaction } from '@/types';
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

export default function CreatorOfferReactionsPage() {
  const [reactions, setReactions] = useState<BrandOfferReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const load = useCallback(async (nextPage = 0, append = false) => {
    setIsLoading(true);
    const result = await offersService
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

  const withdraw = async (reaction: BrandOfferReaction) => {
    try {
      const updated = await offersService.updateCreatorReaction(reaction.offerId, reaction.id, {
        status: 'WITHDRAWN',
      });
      setReactions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Reaction withdrawn');
    } catch (error) {
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
              Offer reactions
            </h1>
          </div>
          <Link
            href="/creator/offers"
            className="flex items-center gap-1.5 rounded-full border border-[#d1ddd6] bg-white px-4 py-2 text-sm font-bold text-[#2d6b4e] transition-colors hover:bg-[#e6eceb]"
          >
            <ArrowLeft className="h-4 w-4" />
            Offers
          </Link>
        </div>

        {/* ── Stat strip ── */}
        {(() => {
          const pending = reactions.filter((r) => ['submitted', 'in_review'].includes(r.status?.toLowerCase())).length;
          const shortlisted = reactions.filter((r) => r.status?.toLowerCase() === 'shortlisted').length;
          const accepted = reactions.filter((r) => r.status?.toLowerCase() === 'accepted').length;
          return (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="rounded-[1.35rem] border border-[#2d6b4e] bg-[#2d6b4e] p-5 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">Total</p>
                    <p className="mt-1.5 text-2xl font-extrabold leading-none">{totalElements}</p>
                  </div>
                  <div className="grid size-9 place-items-center rounded-xl bg-white/15">
                    <MessageSquare className="size-4" />
                  </div>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[#d1ddd6] bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#87938b]">Pending</p>
                    <p className="mt-1.5 text-2xl font-extrabold leading-none text-[#1e3d2e]">{pending}</p>
                  </div>
                  <div className="grid size-9 place-items-center rounded-xl bg-[#f4f7f5]">
                    <Clock className="size-4 text-[#6b7870]" />
                  </div>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[#d1ddd6] bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#87938b]">Shortlisted</p>
                    <p className="mt-1.5 text-2xl font-extrabold leading-none text-[#1e3d2e]">{shortlisted}</p>
                  </div>
                  <div className="grid size-9 place-items-center rounded-xl bg-[#f4f7f5]">
                    <Star className="size-4 text-[#6b7870]" />
                  </div>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[#d1ddd6] bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#b77a12]">Accepted</p>
                    <p className="mt-1.5 text-2xl font-extrabold leading-none text-[#1e3d2e]">{accepted}</p>
                  </div>
                  <div className="grid size-9 place-items-center rounded-xl bg-[#fdf8ec]">
                    <CheckCircle className="size-4 text-[#e6aa38]" />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
              React to brand offers to see your responses here.
            </p>
            <Link
              href="/creator/offers"
              className="mt-6 rounded-full bg-[#2d6b4e] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
            >
              Browse offers
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
                        {reaction.offerTitle || 'Offer'}
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
