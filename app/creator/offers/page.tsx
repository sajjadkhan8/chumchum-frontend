'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CreatorGlobalSearchResults } from '@/components/search/creator-global-search-results';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignGoalBadge } from '@/components/campaign-goal-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CAMPAIGN_GOAL_OPTIONS } from '@/lib/offer-campaign-goals';
import { offersService } from '@/services/offers.service';
import type { BrandOffer, BrandOfferReactionType } from '@/types';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

const OFFER_TYPES = ['UGC', 'POST', 'REEL', 'STORY', 'BUNDLE', 'Custom'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];
const PLATFORMS = ['instagram', 'youtube', 'tiktok', 'facebook', 'snapchat'];
const ANY_CITY_VALUE = '__any_city__';
const ANY_TYPE_VALUE = '__any_type__';
const ANY_PLATFORM_VALUE = '__any_platform__';

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
  return offer.targetCity || 'Nationwide';
};

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
  const [offers, setOffers] = useState<BrandOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // react dialog
  const [selectedOffer, setSelectedOffer] = useState<BrandOffer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactionType, setReactionType] = useState<BrandOfferReactionType>('interested');
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

      const result = await offersService.getCreatorOfferFeed(feedFilters);
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

  const openReaction = (offer: BrandOffer) => {
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
      await offersService.reactToOffer(selectedOffer.id, {
        reactionType: reactionType.toUpperCase() as Uppercase<BrandOfferReactionType>,
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
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Brand Offers</h1>
          <p className="text-sm text-muted-foreground">
            {totalElements > 0 ? `${totalElements} open offers from brands` : 'Find open requests from brands and send your response.'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/creator/offers/reactions">My Reactions</Link>
        </Button>
      </div>

      {/* Search + filter bar */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search offers by title, brief…"
            onKeyDown={(e) => e.key === 'Enter' && void loadOffers(0)}
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters((p) => !p)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-0.5 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {activeFilterChips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
              <span className="text-muted-foreground">{chip.label}:</span>
              <span>{chip.value}</span>
              <button
                type="button"
                onClick={() => {
                  chip.onClear();
                  void loadOffers(0);
                }}
                className="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label={`Clear ${chip.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => { clearFilters(); void loadOffers(0); }}>
            Clear all
          </Button>
        </div>
      )}

      {showFilters && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Select value={city || ANY_CITY_VALUE} onValueChange={(value) => setCity(value === ANY_CITY_VALUE ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Any city" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_CITY_VALUE}>Any city</SelectItem>
                    {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Offer type</Label>
                <Select value={offerType || ANY_TYPE_VALUE} onValueChange={(value) => setOfferType(value === ANY_TYPE_VALUE ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Any type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_TYPE_VALUE}>Any type</SelectItem>
                    {OFFER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Platform</Label>
                <Select value={platform || ANY_PLATFORM_VALUE} onValueChange={(value) => setPlatform(value === ANY_PLATFORM_VALUE ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Any platform" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_PLATFORM_VALUE}>Any platform</SelectItem>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Campaign goal</Label>
                <Select value={campaignGoal || '__all__'} onValueChange={(value) => setCampaignGoal(value === '__all__' ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Any goal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Any goal</SelectItem>
                    {CAMPAIGN_GOAL_OPTIONS.map((goal) => <SelectItem key={goal} value={goal}>{goal}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min budget (PKR)</Label>
                <Input type="number" min={0} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max budget (PKR)</Label>
                <Input type="number" min={0} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="Any" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => void loadOffers(0)}>Apply</Button>
              {activeFilterCount > 0 && (
                <Button size="sm" variant="ghost" onClick={() => { clearFilters(); void loadOffers(0); }}>
                  <X className="mr-1 h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && offers.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading offers…</CardContent></Card>
      ) : offers.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No offers found right now. Try adjusting your filters.</CardContent></Card>
      ) : (
        <>
          <div className="space-y-4">
            {offers.map((offer) => (
              <Card key={offer.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{offer.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{offer.brandName} • {offer.offerType}</p>
                    </div>
                    <Badge>{locationLabel(offer)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{offer.brief}</p>
                  {offer.campaignGoal ? <CampaignGoalBadge goal={offer.campaignGoal} /> : null}
                  {offer.targetPlatforms ? <p className="text-xs text-muted-foreground">Platforms: {offer.targetPlatforms}</p> : null}
                  {offer.contentFormats ? <p className="text-xs text-muted-foreground">Formats: {offer.contentFormats}</p> : null}
                  <p className="text-sm font-medium text-primary">
                    {formatPrice(offer.budgetMin)} – {formatPrice(offer.budgetMax)} {offer.currency}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Deadline: {offer.deadlineDate || 'Open-ended'}</span>
                    {offer.targetLanguage ? <span>Lang: {offer.targetLanguage}</span> : null}
                    <span>Updated {formatRelativeTime(offer.updatedAt)}</span>
                    <Badge variant="outline">Refs {referencesScore(offer)}/7</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/creator/offers/${offer.id}`}>View Details</Link>
                    </Button>
                    <Button size="sm" onClick={() => openReaction(offer)}>React to Offer</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {page < totalPages - 1 && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => void loadOffers(page + 1, true)} disabled={isLoading}>
                {isLoading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>React to: {selectedOffer?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Reaction type</Label>
              <div className="flex flex-wrap gap-2">
                {(['interested', 'proposal', 'question', 'decline'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={reactionType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReactionType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share your approach, pitch, or question" />
            </div>
            {reactionType === 'proposal' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Proposed price (PKR)</Label>
                  <Input type="number" min={0} value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Delivery days</Label>
                  <Input type="number" min={1} value={proposedDays} onChange={(e) => setProposedDays(e.target.value)} />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => void submitReaction()} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit Reaction'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CreatorOffersPage() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search')?.trim() ?? '';

  if (searchTerm) {
    return <CreatorGlobalSearchResults />;
  }

  return <CreatorOffersFeedPage />;
}

