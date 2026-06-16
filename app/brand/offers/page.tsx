'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Eye,
  MapPin,
  Megaphone,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CampaignGoalBadge } from '@/components/campaign-goal-badge';
import { offersService } from '@/services/offers.service';
import type { BrandOffer, BrandOfferStatus } from '@/types';
import { cn, formatPrice, formatRelativeTime } from '@/lib/utils';

const statusTabs: Array<{ value: 'all' | BrandOfferStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Live' },
  { value: 'draft', label: 'Drafts' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

const statusTone: Record<BrandOfferStatus, string> = {
  published: 'bg-[#e7f0ea] text-[#185c39] ring-[#bcd3c5]',
  draft: 'bg-[#fff1cd] text-[#8b5e12] ring-[#efcf83]',
  paused: 'bg-[#f5e7cf] text-[#8b5e12] ring-[#e6c792]',
  closed: 'bg-[#eef2eb] text-[#526259] ring-[#d5ddd6]',
  archived: 'bg-[#f2eee7] text-[#6d6258] ring-[#ddd2c7]',
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

const locationLabel = (offer: BrandOffer) => {
  if (offer.locationTargetingMode === 'remote_only') return 'Remote / Online only';
  if (offer.locationTargetingMode === 'region') return offer.targetRegion || offer.targetCity || 'Region';
  if (offer.locationTargetingMode === 'cities') return offer.targetCities || offer.targetCity || 'Selected cities';
  return 'Nationwide';
};

const offerTypeLabel = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function StatPill({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-[1.15rem] border border-white/12 bg-white/8 px-2.5 py-2.5 backdrop-blur sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden size-9 shrink-0 place-items-center rounded-2xl bg-[#e6aa38] text-[#173b2a] sm:grid">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#d4e0d8] sm:text-[10px] sm:tracking-[0.16em]">{label}</p>
          <p className="mt-0.5 truncate text-base font-black tracking-[-0.04em] text-white sm:text-lg">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ activeTab }: { activeTab: string }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-[#cdd7ce] bg-white p-6 text-center shadow-[0_18px_60px_rgba(38,70,50,0.06)]">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f4f2e9] text-[#b77a12]">
        <Megaphone className="size-5" />
      </div>
      <h2 className="mt-4 text-xl font-black tracking-[-0.04em] text-[#173b2a]">
        {activeTab === 'all' ? 'No offers yet.' : `No ${activeTab} offers yet.`}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647168]">
        Create a compact food campaign brief for tastings, launch reels, hotel stays, cafe openings, dessert drops, or fast-food promos.
      </p>
      <Button asChild className="mt-5 rounded-full bg-[#185c39] px-5 font-extrabold text-white hover:bg-[#12462b]">
        <Link href="/brand/offers/new">
          <Plus className="mr-2 size-4" />
          Create Offer
        </Link>
      </Button>
    </div>
  );
}

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

  const statusCounts = useMemo(() => {
    return offers.reduce(
      (counts, offer) => {
        counts[offer.status] += 1;
        return counts;
      },
      { draft: 0, published: 0, paused: 0, closed: 0, archived: 0 } as Record<BrandOfferStatus, number>
    );
  }, [offers]);

  const totalBudget = useMemo(() => offers.reduce((total, offer) => total + (offer.budgetMax || offer.budgetMin || 0), 0), [offers]);
  const totalReactions = useMemo(() => offers.reduce((total, offer) => total + (offer.reactionCount || 0), 0), [offers]);
  const topOffer = useMemo(() => offers.reduce<BrandOffer | null>((best, offer) => (!best || offer.reactionCount > best.reactionCount ? offer : best), null), [offers]);

  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#d9e0d8] bg-[#173b2a] text-white shadow-[0_24px_80px_rgba(23,59,42,0.14)]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-5 sm:p-6 lg:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
                    <Sparkles className="size-3.5" />
                    Food campaign desk
                  </div>
                  <h1 className="mt-4 text-[clamp(2rem,4vw,3.9rem)] font-black leading-[0.98] tracking-[-0.06em]">
                    Offers built for tastings, tables, and local buzz.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-[#c7d8ce] sm:text-base">
                    Keep every restaurant, cafe, ice cream, hotel, and fast-food collaboration tight: brief, budget, reach, and creator response in one compact workspace.
                  </p>
                </div>
                <Button asChild className="shrink-0 rounded-full bg-[#e6aa38] px-5 font-black text-[#173b2a] hover:bg-[#f0bb55]">
                  <Link href="/brand/offers/new">
                    <Plus className="mr-2 size-4" />
                    New Offer
                  </Link>
                </Button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                <StatPill label="Live offers" value={String(statusCounts.published)} icon={Megaphone} />
                <StatPill label="Creator interest" value={String(totalReactions)} icon={Users} />
                <StatPill label="Max budget" value={totalBudget ? formatPrice(totalBudget) : 'Not set'} icon={Wallet} />
              </div>
            </div>

            <aside className="hidden border-t border-white/10 bg-white/[0.06] p-5 sm:block sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f0c56e]">Quick read</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-[1.25rem] border border-white/12 bg-[#102d20]/60 p-4">
                  <p className="text-sm font-black text-white">{topOffer ? topOffer.title : 'Launch your first food offer'}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#c7d8ce]">
                    {topOffer ? topOffer.brief : 'Start with a weekend tasting or launch reel. Clear deliverables usually get better creator responses.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.15rem] border border-white/12 bg-white/8 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d4e0d8]">Drafts</p>
                    <p className="mt-1 text-2xl font-black tracking-[-0.04em]">{statusCounts.draft}</p>
                  </div>
                  <div className="rounded-[1.15rem] border border-white/12 bg-white/8 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d4e0d8]">Paused</p>
                    <p className="mt-1 text-2xl font-black tracking-[-0.04em]">{statusCounts.paused}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-4 rounded-[1.5rem] border border-[#d9e0d8] bg-white p-3 shadow-[0_16px_54px_rgba(38,70,50,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {statusTabs.map((tab) => {
                const count = tab.value === 'all' ? offers.length : statusCounts[tab.value];
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-black transition',
                      isActive ? 'bg-[#185c39] text-white shadow-[0_10px_24px_rgba(24,92,57,0.18)]' : 'bg-[#f4f2e9] text-[#607168] hover:bg-[#e7f0ea] hover:text-[#185c39]'
                    )}
                  >
                    {tab.label}
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px]', isActive ? 'bg-white/16 text-white' : 'bg-white text-[#7b867f]')}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#647168]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2e9] px-3 py-2">
                <ClipboardList className="size-3.5 text-[#b77a12]" />
                {totalElements > 0 ? `${totalElements} total offers` : 'Offer list ready'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-[#185c39] hover:bg-[#e7f0ea] hover:text-[#185c39]"
                onClick={() => void load(0)}
                disabled={isLoading}
              >
                <RefreshCw className={cn('mr-2 size-3.5', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-4">
          {isLoading && offers.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[#d9e0d8] bg-white p-6 text-center text-sm font-bold text-[#647168] shadow-[0_18px_60px_rgba(38,70,50,0.06)]">
              Loading your offers...
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState activeTab={activeTab} />
          ) : (
            <div className="grid gap-3">
              {filtered.map((offer) => {
                const refScore = referencesScore(offer);
                return (
                  <article
                    key={offer.id}
                    className="group rounded-[1.45rem] border border-[#d9e0d8] bg-white p-4 shadow-[0_14px_45px_rgba(38,70,50,0.055)] transition hover:-translate-y-0.5 hover:border-[#b7c8bd] hover:shadow-[0_22px_70px_rgba(38,70,50,0.10)] sm:p-5"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn('rounded-full px-2.5 py-1 text-[11px] font-black capitalize ring-1', statusTone[offer.status])}>
                            {offer.status.replace('_', ' ')}
                          </Badge>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2e9] px-2.5 py-1 text-[11px] font-black text-[#607168]">
                            <Target className="size-3.5 text-[#b77a12]" />
                            {offer.campaignGoal ? <CampaignGoalBadge goal={offer.campaignGoal} /> : 'Food campaign'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2e9] px-2.5 py-1 text-[11px] font-black text-[#607168]">
                            <MapPin className="size-3.5 text-[#b77a12]" />
                            {locationLabel(offer)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h2 className="line-clamp-1 text-xl font-black tracking-[-0.04em] text-[#173b2a]">{offer.title}</h2>
                            <p className="mt-1 text-sm font-bold text-[#718077]">{offerTypeLabel(offer.offerType)}</p>
                          </div>
                          <p className="shrink-0 rounded-full bg-[#fff1cd] px-3 py-1.5 text-sm font-black text-[#8b5e12]">
                            {formatPrice(offer.budgetMin)} - {formatPrice(offer.budgetMax)} {offer.currency}
                          </p>
                        </div>

                        <p className="mt-3 line-clamp-2 max-w-4xl text-sm leading-6 text-[#647168]">{offer.brief}</p>

                        <div className="mt-4 grid gap-2 text-sm font-bold text-[#607168] sm:grid-cols-3">
                          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
                            <Users className="size-4 text-[#185c39]" />
                            {offer.reactionCount} reactions
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
                            <CalendarClock className="size-4 text-[#185c39]" />
                            Updated {formatRelativeTime(offer.updatedAt)}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
                            <ClipboardList className="size-4 text-[#185c39]" />
                            Brief refs {refScore}/7
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-row gap-2 lg:flex-col lg:items-stretch">
                        <Button asChild className="flex-1 rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b] lg:flex-none">
                          <Link href={`/brand/offers/${offer.id}`}>
                            Manage <ArrowRight className="ml-2 size-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1 rounded-full border-[#d9e0d8] bg-[#fbfaf5] font-black text-[#185c39] hover:bg-[#e7f0ea] lg:flex-none">
                          <Link href={`/brand/offers/${offer.id}`}>
                            <Eye className="mr-2 size-4" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {page < totalPages - 1 && activeTab === 'all' && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => void load(page + 1, true)}
                disabled={isLoading}
                className="rounded-full border-[#d9e0d8] bg-white px-6 font-black text-[#185c39] hover:bg-[#e7f0ea]"
              >
                {isLoading ? 'Loading...' : 'Load more offers'}
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
