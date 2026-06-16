'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DollarSign, Layers, Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CampaignGoalBadge } from '@/components/campaign-goal-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CAMPAIGN_GOAL_OPTIONS } from '@/lib/offer-campaign-goals';
import { campaignsService } from '@/services/campaigns.service';
import type { BrandCampaign, BrandCampaignReactionType } from '@/types';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

const OFFER_TYPES = ['UGC', 'POST', 'REEL', 'STORY', 'BUNDLE', 'Custom'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];
const PLATFORMS = ['instagram', 'youtube', 'tiktok', 'facebook', 'snapchat'];
const ANY_CITY_VALUE = '__any_city__';
const ANY_TYPE_VALUE = '__any_type__';
const ANY_PLATFORM_VALUE = '__any_platform__';

const panelClass =
  'rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]';
const inputClass =
  'h-10 w-full rounded-xl border-[#cddad1] bg-[#fbfaf5] px-3.5 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none focus-visible:border-[#2d6b4e] focus-visible:ring-4 focus-visible:ring-[#2d6b4e]/8 focus-visible:ring-offset-0';

const referencesScore = (offer: BrandCampaign) => {
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

const locationLabel = (offer: BrandCampaign) => {
  if (offer.locationTargetingMode === 'remote_only') return 'Remote / Online only';
  if (offer.locationTargetingMode === 'region') return offer.targetRegion || offer.targetCity || 'Region';
  if (offer.locationTargetingMode === 'cities') return offer.targetCities || offer.targetCity || 'Selected cities';
  return offer.targetCity || 'Nationwide';
};

function SkeletonCard() {
  return (
    <div className={`${panelClass} overflow-hidden animate-pulse`}>
      <div className="flex items-center justify-between border-b border-[#e8eeeb] px-5 py-4">
        <div className="space-y-2">
          <div className="h-4 w-48 rounded-full bg-[#e6eceb]" />
          <div className="h-3 w-28 rounded-full bg-[#e6eceb]" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full bg-[#e6eceb]" />
          <div className="h-5 w-16 rounded-full bg-[#e6eceb]" />
        </div>
      </div>
      <div className="space-y-3 px-5 py-4">
        <div className="h-3 w-full rounded-full bg-[#e6eceb]" />
        <div className="h-3 w-4/5 rounded-full bg-[#e6eceb]" />
        <div className="h-5 w-24 rounded-full bg-[#e6eceb]" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-32 rounded-full bg-[#e6eceb]" />
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-full bg-[#e6eceb]" />
            <div className="h-8 w-28 rounded-full bg-[#e6eceb]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatorOffersFeedPage() {
  const router = useRouter();

  // filters
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [offerType, setOfferType] = useState('');
  const [platform, setPlatform] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // data
  const [offers, setOffers] = useState<BrandCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // react dialog
  const [selectedOffer, setSelectedOffer] = useState<BrandCampaign | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactionType, setReactionType] = useState<BrandCampaignReactionType>('interested');
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedDays, setProposedDays] = useState('');

  const loadOffers = useCallback(async (nextPage = 0, append = false) => {
    setIsLoading(true);
    try {
      const feedFilters: any = {
        search: search.trim() || undefined,
        city: city || undefined,
        offerType: offerType || undefined,
        platform: platform || undefined,
        campaignGoal: campaignGoal || undefined,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        page: nextPage,
        size: 20,
      };

      const result = await campaignsService.getCreatorCampaignFeed(feedFilters);
      const normalized = Array.isArray(result)
        ? { content: result, totalElements: result.length, totalPages: 1, last: true }
        : result;

      setOffers(append ? (prev) => [...prev, ...normalized.content] : normalized.content);
      setTotalPages(normalized.totalPages);
      setTotalElements(normalized.totalElements);
      setPage(nextPage);
    } catch {
      toast.error('Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  }, [search, city, offerType, platform, campaignGoal, budgetMin, budgetMax]);

  useEffect(() => {
    void loadOffers(0);
  }, [loadOffers]);

  const activeFilterCount = [city, offerType, platform, campaignGoal, budgetMin, budgetMax].filter(Boolean).length;

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string; onClear: () => void }> = [];

    if (search.trim()) chips.push({ key: 'search', label: 'Search', value: search.trim(), onClear: () => setSearch('') });
    if (city) chips.push({ key: 'city', label: 'City', value: city, onClear: () => setCity('') });
    if (offerType) chips.push({ key: 'offerType', label: 'Offer type', value: offerType, onClear: () => setOfferType('') });
    if (platform) chips.push({ key: 'platform', label: 'Platform', value: platform, onClear: () => setPlatform('') });
    if (campaignGoal) chips.push({ key: 'campaignGoal', label: 'Goal', value: campaignGoal, onClear: () => setCampaignGoal('') });
    if (budgetMin) chips.push({ key: 'budgetMin', label: 'Min budget', value: `PKR ${budgetMin}`, onClear: () => setBudgetMin('') });
    if (budgetMax) chips.push({ key: 'budgetMax', label: 'Max budget', value: `PKR ${budgetMax}`, onClear: () => setBudgetMax('') });

    return chips;
  }, [budgetMax, budgetMin, campaignGoal, city, offerType, platform, search]);

  const clearFilters = () => {
    setCity('');
    setOfferType('');
    setPlatform('');
    setCampaignGoal('');
    setBudgetMin('');
    setBudgetMax('');
  };

  const openReaction = (offer: BrandCampaign) => {
    setSelectedOffer(offer);
    setReactionType('interested');
    setMessage('');
    setProposedPrice('');
    setProposedDays('');
    setIsDialogOpen(true);
  };

  const submitReaction = async () => {
    if (!selectedOffer) return;
    setIsSubmitting(true);
    try {
      await campaignsService.reactToCampaign(selectedOffer.id, {
        reactionType: reactionType.toUpperCase() as Uppercase<BrandCampaignReactionType>,
        message: message || undefined,
        proposedPrice: proposedPrice ? Number(proposedPrice) : undefined,
        proposedDeliveryDays: proposedDays ? Number(proposedDays) : undefined,
      });
      toast.success('Reaction submitted to brand');
      setIsDialogOpen(false);
      router.push('/creator/offers/reactions');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit reaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-8 pt-2 text-[#1e3d2e] sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1320px] space-y-4">

        {/* Top bar */}
        <div className="flex justify-end">
          <Link
            href="/creator/offers/reactions"
            className="rounded-full border border-[#d1ddd6] bg-white px-4 py-2 text-sm font-bold text-[#2d6b4e] hover:bg-[#e6eceb] transition-colors"
          >
            My Reactions
          </Link>
        </div>

        {/* ── Stat strip ── */}
        {(() => {
          const avgBudget = offers.length
            ? offers.reduce((sum, o) => sum + ((o.budgetMin || 0) + (o.budgetMax || 0)) / 2, 0) / offers.length
            : 0;
          const typeCount = new Set(offers.map((o) => o.offerType).filter(Boolean)).size;
          return (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="rounded-[1.35rem] border border-[#2d6b4e] bg-[#2d6b4e] p-5 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">Open Offers</p>
                    <p className="mt-1.5 text-2xl font-extrabold leading-none">{totalElements}</p>
                  </div>
                  <div className="grid size-9 place-items-center rounded-xl bg-white/15">
                    <Layers className="size-4" />
                  </div>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[#d1ddd6] bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#87938b]">Loaded</p>
                    <p className="mt-1.5 text-2xl font-extrabold leading-none text-[#1e3d2e]">{offers.length}</p>
                  </div>
                  <div className="grid size-9 place-items-center rounded-xl bg-[#f4f7f5]">
                    <Search className="size-4 text-[#6b7870]" />
                  </div>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[#d1ddd6] bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#87938b]">Offer Types</p>
                    <p className="mt-1.5 text-2xl font-extrabold leading-none text-[#1e3d2e]">{typeCount || '—'}</p>
                  </div>
                  <div className="grid size-9 place-items-center rounded-xl bg-[#f4f7f5]">
                    <Layers className="size-4 text-[#6b7870]" />
                  </div>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[#d1ddd6] bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#b77a12]">Avg. Budget</p>
                    <p className="mt-1.5 text-2xl font-extrabold leading-none text-[#1e3d2e]">{avgBudget ? formatPrice(avgBudget) : '—'}</p>
                  </div>
                  <div className="grid size-9 place-items-center rounded-xl bg-[#fdf8ec]">
                    <DollarSign className="size-4 text-[#e6aa38]" />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Search + filter bar */}
        <div className={`${panelClass} p-4`}>
          <div className="flex gap-2">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b0bfb8]" />
              <Input
                className={`${inputClass} pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search offers by title, brief…"
                onKeyDown={(e) => e.key === 'Enter' && void loadOffers(0)}
              />
            </div>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((p) => !p)}
              className="relative inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#cddad1] bg-[#fbfaf5] px-3.5 text-sm font-bold text-[#2d6b4e] transition-colors hover:bg-[#e6eceb]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2d6b4e] px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Apply button — only when filters open */}
            {showFilters && (
              <button
                type="button"
                onClick={() => void loadOffers(0)}
                className="h-10 rounded-full bg-[#2d6b4e] px-5 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
              >
                Apply
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilterChips.length > 0 && (
            <div className="mt-3 inline-flex flex-wrap gap-2">
              {activeFilterChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#e6eceb] px-3 py-1 text-xs font-bold text-[#2d6b4e]"
                >
                  <span className="text-[#87938b] font-normal">{chip.label}:</span>
                  {chip.value}
                  <button
                    type="button"
                    onClick={() => { chip.onClear(); void loadOffers(0); }}
                    className="rounded-full p-0.5 transition-colors hover:bg-[#d1ddd6]"
                    aria-label={`Clear ${chip.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => { clearFilters(); void loadOffers(0); }}
                className="rounded-full px-3 py-1 text-xs font-bold text-[#87938b] transition-colors hover:bg-[#e6eceb]"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Collapsible filter panel */}
          {showFilters && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* City */}
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">City</p>
                <Select value={city || ANY_CITY_VALUE} onValueChange={(value) => setCity(value === ANY_CITY_VALUE ? '' : value)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Any city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_CITY_VALUE}>Any city</SelectItem>
                    {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Offer type */}
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Offer Type</p>
                <Select value={offerType || ANY_TYPE_VALUE} onValueChange={(value) => setOfferType(value === ANY_TYPE_VALUE ? '' : value)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_TYPE_VALUE}>Any type</SelectItem>
                    {OFFER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform */}
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Platform</p>
                <Select value={platform || ANY_PLATFORM_VALUE} onValueChange={(value) => setPlatform(value === ANY_PLATFORM_VALUE ? '' : value)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Any platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_PLATFORM_VALUE}>Any platform</SelectItem>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Campaign goal */}
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Campaign Goal</p>
                <Select value={campaignGoal || '__all__'} onValueChange={(value) => setCampaignGoal(value === '__all__' ? '' : value)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Any goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Any goal</SelectItem>
                    {CAMPAIGN_GOAL_OPTIONS.map((goal) => <SelectItem key={goal} value={goal}>{goal}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Budget min */}
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Min Budget (PKR)</p>
                <Input
                  type="number"
                  min={0}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>

              {/* Budget max */}
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Max Budget (PKR)</p>
                <Input
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="Any"
                  className={inputClass}
                />
              </div>

              {/* Filter actions */}
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => void loadOffers(0)}
                  className="h-10 rounded-full bg-[#2d6b4e] px-6 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
                >
                  Apply Filters
                </button>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { clearFilters(); void loadOffers(0); }}
                    className="inline-flex h-10 items-center gap-1 rounded-full border border-[#d1ddd6] bg-white px-5 text-sm font-bold text-[#6b7870] transition-colors hover:bg-[#e6eceb]"
                  >
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Offers list */}
        {isLoading && offers.length === 0 ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="size-10 text-[#c2d8cb]" />
            <p className="mt-4 text-base font-bold text-[#1e3d2e]">No offers right now</p>
            <p className="mt-1 text-sm text-[#87938b]">Try adjusting your filters to see more results</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className={`${panelClass} overflow-hidden`}>
                  {/* Card header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8eeeb] px-5 py-4">
                    <div>
                      <p className="font-extrabold text-[#1e3d2e]">{offer.title}</p>
                      <p className="mt-0.5 text-xs text-[#87938b]">{offer.brandName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#e6eceb] px-2.5 py-0.5 text-[10px] font-bold text-[#2d6b4e]">
                        {locationLabel(offer)}
                      </span>
                      <span className="rounded-full bg-[#e6eceb] px-2.5 py-0.5 text-[10px] font-bold text-[#2d6b4e]">
                        {offer.offerType}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="space-y-3 px-5 py-4">
                    <p className="line-clamp-2 text-sm text-[#6b7870]">{offer.brief}</p>

                    {offer.campaignGoal ? <CampaignGoalBadge goal={offer.campaignGoal} /> : null}

                    {(offer.targetPlatforms || offer.contentFormats) && (
                      <p className="text-xs text-[#87938b]">
                        {offer.targetPlatforms && <span>Platforms: {offer.targetPlatforms}</span>}
                        {offer.targetPlatforms && offer.contentFormats && <span className="mx-1.5">·</span>}
                        {offer.contentFormats && <span>Formats: {offer.contentFormats}</span>}
                      </p>
                    )}

                    {/* Budget */}
                    <p className="text-lg font-extrabold text-[#e6aa38]">
                      {formatPrice(offer.budgetMin)} – {formatPrice(offer.budgetMax)}
                    </p>

                    {/* Footer row */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#87938b]">
                        <span>Deadline: {offer.deadlineDate || 'Open-ended'}</span>
                        {offer.targetLanguage && <span>Lang: {offer.targetLanguage}</span>}
                        <span>Updated {formatRelativeTime(offer.updatedAt)}</span>
                        <span className="rounded-full bg-[#e6eceb] px-2 py-0.5 text-[10px] font-bold text-[#2d6b4e]">
                          {referencesScore(offer)}/7 refs
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/creator/offers/${offer.id}`}
                          className="rounded-full border border-[#d1ddd6] bg-white px-4 py-2 text-xs font-bold text-[#2d6b4e] transition-colors hover:bg-[#e6eceb]"
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => openReaction(offer)}
                          className="rounded-full bg-[#2d6b4e] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1f5239]"
                        >
                          React to Offer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {page < totalPages - 1 && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => void loadOffers(page + 1, true)}
                  disabled={isLoading}
                  className="rounded-full border border-[#d1ddd6] bg-white px-6 py-2.5 text-sm font-bold text-[#2d6b4e] transition-colors hover:bg-[#e6eceb] disabled:opacity-50"
                >
                  {isLoading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Reaction Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg overflow-hidden rounded-[1.6rem] p-0">
            {/* Dialog header strip */}
            <DialogHeader className="bg-[#1e3d2e] px-6 py-5">
              <DialogTitle className="text-white">React to Offer</DialogTitle>
              {selectedOffer && (
                <p className="mt-0.5 text-sm text-[#87b49a]">{selectedOffer.title}</p>
              )}
            </DialogHeader>

            {/* Dialog body */}
            <div className="space-y-4 px-6 py-5">
              {/* Reaction type pills */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Reaction Type</p>
                <div className="flex flex-wrap gap-2">
                  {(['interested', 'proposal', 'question', 'decline'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReactionType(type)}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors capitalize ${
                        reactionType === type
                          ? 'bg-[#2d6b4e] text-white'
                          : 'border border-[#d1ddd6] bg-white text-[#6b7870] hover:bg-[#e6eceb]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Message</p>
                <Textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your approach, pitch, or question"
                  className="resize-none rounded-xl border-[#cddad1] bg-[#fbfaf5] text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] focus-visible:border-[#2d6b4e] focus-visible:ring-4 focus-visible:ring-[#2d6b4e]/8 focus-visible:ring-offset-0"
                />
              </div>

              {/* Proposal fields */}
              {reactionType === 'proposal' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Proposed Price (PKR)</p>
                    <Input
                      type="number"
                      min={0}
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#87938b]">Delivery Days</p>
                    <Input
                      type="number"
                      min={1}
                      value={proposedDays}
                      onChange={(e) => setProposedDays(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-full border border-[#d1ddd6] bg-white px-5 py-2 text-sm font-bold text-[#6b7870] transition-colors hover:bg-[#e6eceb]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitReaction()}
                  disabled={isSubmitting}
                  className="rounded-full bg-[#2d6b4e] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1f5239] disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Reaction'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function CreatorOffersPage() {
  return <CreatorOffersFeedPage />;
}
