'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock3,
  Play,
  Search,
  Star,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn, formatFollowers, formatPrice, formatRelativeTime } from '@/lib/utils';
import { getCreatorGlobalSearchResults, type CreatorGlobalSearchResults as CreatorGlobalSearchPayload, type CreatorSearchBrandResult } from '@/lib/search/creator-search';
import type { BrandOffer, Creator } from '@/types';

type SearchTab = 'brands' | 'offers' | 'creators';
type SortOption = 'relevant' | 'top-rated' | 'budget-high';

type SearchFilters = {
  industries: string[];
  contentTypes: string[];
  verifiedOnly: boolean;
  fourStarPlus: boolean;
  paysOnTime: boolean;
  budgetRange: [number, number];
};

const DEFAULT_BUDGET_RANGE: [number, number] = [10000, 200000];
const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'relevant', label: 'Most relevant' },
  { value: 'top-rated', label: 'Top rated' },
  { value: 'budget-high', label: 'Budget: high' },
];
const FALLBACK_INDUSTRIES = ['Fashion & Apparel', 'Sports & Fitness', 'Beauty & Lifestyle', 'Tech & Gadgets'];
const FALLBACK_CONTENT_TYPES = ['Reels / Short video', 'Static post', 'Story', 'Blog / Article'];

const normalize = (value?: string | null) => value?.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() ?? '';

const splitList = (value?: string | null) =>
  (value ?? '')
    .split(/[|,•]/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatShortRs = (amount: number) => {
  if (amount >= 1000000) {
    return `Rs ${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1)}M`;
  }
  if (amount >= 1000) {
    return `Rs ${(amount / 1000).toFixed(amount >= 100000 ? 0 : 1)}k`;
  }
  return `Rs ${amount}`;
};

const titleCase = (value: string) => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const contentTypeTokens = (offer: BrandOffer) => {
  const combined = [offer.offerType, offer.contentFormats, offer.targetPlatforms].flatMap((value) => splitList(value));
  const values = new Set<string>();

  for (const token of combined) {
    const normalized = normalize(token);
    if (!normalized) continue;
    if (normalized.includes('reel') || normalized.includes('tiktok') || normalized.includes('short')) values.add('Reels / Short video');
    else if (normalized.includes('story')) values.add('Story');
    else if (normalized.includes('blog') || normalized.includes('article')) values.add('Blog / Article');
    else values.add('Static post');
  }

  return Array.from(values);
};

const offerIndustryTokens = (offer: BrandOffer) => {
  const tokens = [...splitList(offer.categories), ...splitList(offer.niches)];
  return tokens.length > 0 ? tokens : ['Brand collaborations'];
};

const brandMatchesIndustry = (brand: CreatorSearchBrandResult, industries: string[]) => {
  if (industries.length === 0) return true;
  const fields = [brand.industry, ...brand.tags].map((value) => normalize(value));
  return industries.some((industry) => fields.some((field) => field.includes(normalize(industry))));
};

const brandMatchesContentType = (brand: CreatorSearchBrandResult, contentTypes: string[]) => {
  if (contentTypes.length === 0) return true;
  return brand.activeOffers.some((offer) => contentTypes.some((contentType) => contentTypeTokens(offer).includes(contentType)));
};

const creatorMatchesIndustry = (creator: Creator, industries: string[]) => {
  if (industries.length === 0) return true;
  const fields = [creator.bio, creator.city, ...creator.categories].map((value) => normalize(value));
  return industries.some((industry) => fields.some((field) => field.includes(normalize(industry))));
};

const creatorMatchesContentType = (creator: Creator, contentTypes: string[]) => {
  if (contentTypes.length === 0) return true;
  const platformNames = creator.platforms.map((platform) => normalize(platform.platform));
  return contentTypes.some((contentType) => {
    if (contentType === 'Reels / Short video') return platformNames.some((platform) => ['instagram', 'tiktok', 'youtube'].includes(platform));
    if (contentType === 'Story') return platformNames.includes('instagram') || platformNames.includes('snapchat');
    if (contentType === 'Blog / Article') return platformNames.includes('facebook') || normalize(creator.bio).includes('blog');
    return true;
  });
};

const offerDaysLeft = (offer: BrandOffer) => {
  if (!offer.deadlineDate) return null;
  const deadline = new Date(offer.deadlineDate);
  if (Number.isNaN(deadline.getTime())) return null;
  const diff = deadline.getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Closed';
  if (days === 0) return 'Ends today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
};

const compactOfferBudget = (offer: BrandOffer) => {
  const average = Math.round((offer.budgetMin + offer.budgetMax) / 2);
  return average > 0 ? formatShortRs(average) : formatPrice(offer.budgetMax || offer.budgetMin || 0);
};

const dedupeOffers = (offers: BrandOffer[]) => {
  const seen = new Set<string>();
  return offers.filter((offer) => {
    if (seen.has(offer.id)) return false;
    seen.add(offer.id);
    return true;
  });
};

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-[28px] border border-white/8 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="animate-pulse space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/8" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-40 rounded-full bg-white/8" />
                <div className="h-4 w-72 rounded-full bg-white/8" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 rounded-full bg-white/8" />
                  <div className="h-8 w-24 rounded-full bg-white/8" />
                  <div className="h-8 w-16 rounded-full bg-white/8" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-12 rounded-2xl bg-white/8" />
              <div className="h-12 rounded-2xl bg-white/8" />
              <div className="h-12 rounded-2xl bg-white/8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
  onReset,
}: {
  title: string;
  description: string;
  onReset?: () => void;
}) {
  return (
    <Card className="rounded-[28px] border-white/8 bg-white/[0.04] text-white shadow-none">
      <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <div className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-emerald-400">
          <Search className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="max-w-xl text-sm text-white/58">{description}</p>
        </div>
        {onReset ? (
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="mt-3 rounded-full border-white/12 bg-transparent text-white hover:bg-white/8 hover:text-white"
          >
            Reset filters
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ResultCountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs font-semibold text-white/62">
      {count}
    </span>
  );
}

function BrandResultCard({
  brand,
  isFocused,
  onViewOffers,
  onClearBrandFocus,
}: {
  brand: CreatorSearchBrandResult;
  isFocused: boolean;
  onViewOffers: (brandId: string) => void;
  onClearBrandFocus: () => void;
}) {
  return (
    <article
      className={cn(
        'rounded-[28px] border border-white/8 bg-white/[0.05] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-emerald-500/25 hover:bg-white/[0.06]',
        isFocused && 'border-emerald-500/40 bg-emerald-500/[0.08]',
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#101111] text-2xl font-semibold text-white">
            {brand.initials}
          </div>
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-white md:text-[1.7rem]">
                {brand.name}
              </h3>
              {brand.isVerified ? (
                <Badge className="rounded-full border border-emerald-400/20 bg-emerald-500/14 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/14">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </Badge>
              ) : null}
              <Badge className="rounded-full border border-emerald-400/10 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10">
                <Star className="h-4 w-4 fill-current" /> {brand.rating.toFixed(1)}
                <span className="text-white/55">·</span>
                {brand.paysOnTime ? 'Pays on time' : 'Responsive'}
              </Badge>
            </div>

            <p className="text-sm text-white/58">
              <span>{brand.industry}</span>
              <span className="px-2 text-white/25">·</span>
              <span>{brand.city}</span>
              <span className="px-2 text-white/25">·</span>
              <span>{brand.campaignCount} campaigns run</span>
            </p>

            {brand.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {brand.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-transparent px-3 py-1 text-sm text-white/62"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-3 lg:min-w-[34rem]">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-white/38" />
                <span className="text-white/48">Avg budget</span>
                <span className="font-semibold text-white">{formatShortRs(brand.avgBudget)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-white/38" />
                <span className="font-semibold text-white">{brand.creatorsHired}</span>
                <span className="text-white/48">creators hired</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-white/38" />
                <span className="text-white/48">Replies in</span>
                <span className="font-semibold text-white">{brand.replyTimeLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid shrink-0 gap-3 sm:w-[11rem]">
          <Button
            type="button"
            onClick={() => onViewOffers(brand.id)}
            className="h-11 rounded-2xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            View offers
          </Button>
          {brand.website ? (
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-2xl border-white/10 bg-transparent text-sm text-white/82 hover:bg-white/8 hover:text-white"
            >
              <a href={brand.website} target="_blank" rel="noreferrer">
                View profile
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-11 rounded-2xl border-white/10 bg-transparent text-base text-white/40"
            >
              View profile
            </Button>
          )}
          {isFocused ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onClearBrandFocus}
              className="h-10 rounded-2xl text-sm text-white/55 hover:bg-white/8 hover:text-white"
            >
              Clear focus
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function OfferResultCard({
  offer,
  brand,
  compact = false,
}: {
  offer: BrandOffer;
  brand?: CreatorSearchBrandResult;
  compact?: boolean;
}) {
  const deadlineLabel = offerDaysLeft(offer);
  const contentTypes = contentTypeTokens(offer);
  const brandInitials = brand?.initials ?? offer.brandName.slice(0, 2).toUpperCase();

  return (
    <article className={cn('rounded-[28px] border border-white/8 bg-white/[0.05] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]', compact ? 'p-5' : 'p-6')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#101111] text-xl font-semibold text-white">
            {brandInitials}
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-3 text-sm text-white/55">
              <span className="font-medium text-white/72">{offer.brandName}</span>
              {brand?.isVerified ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : null}
              {brand?.isVerified ? <span className="text-emerald-300">Verified</span> : null}
            </div>
            <h3 className={cn('font-semibold tracking-[-0.01em] text-white', compact ? 'text-xl' : 'text-2xl')}>
              {offer.title}
            </h3>
            <p className={cn('max-w-4xl text-white/58', compact ? 'text-sm leading-6' : 'text-base leading-7')}>
              {offer.brief}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:min-w-[10rem] sm:items-end">
          <Button asChild className="h-11 rounded-2xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500">
            <Link href={`/creator/offers/${offer.id}`}>Apply now</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-2xl border-white/10 bg-transparent text-sm text-white/82 hover:bg-white/8 hover:text-white">
            <Link href={`/creator/offers/${offer.id}`}>View details</Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/52">
        <span className="text-xl font-semibold tracking-[-0.01em] text-emerald-300">{compactOfferBudget(offer)}</span>
        {deadlineLabel ? (
          <span className="inline-flex items-center gap-2 text-amber-300">
            <Clock3 className="h-4 w-4" /> {deadlineLabel}
          </span>
        ) : null}
        {offer.maxApplicants ? (
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4" /> {offer.maxApplicants} spots left
          </span>
        ) : null}
        {contentTypes[0] ? (
          <span className="inline-flex items-center gap-2">
            <Play className="h-4 w-4" /> {contentTypes[0]}
          </span>
        ) : null}
        <span>Updated {formatRelativeTime(offer.updatedAt)}</span>
      </div>
    </article>
  );
}

function CreatorResultCard({ creator }: { creator: Creator }) {
  const budgetValue = Math.round(((creator.minPrice ?? 0) + (creator.maxPrice ?? creator.minPrice ?? 0)) / 2);

  return (
    <article className="rounded-[28px] border border-white/8 bg-white/[0.05] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-emerald-500/25 hover:bg-white/[0.06]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover"
          />
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-semibold tracking-[-0.02em] text-white">{creator.name}</h3>
              {creator.isVerified ? (
                <Badge className="rounded-full border border-emerald-400/20 bg-emerald-500/14 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/14">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </Badge>
              ) : null}
              <Badge className="rounded-full border border-emerald-400/10 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10">
                <Star className="h-4 w-4 fill-current" /> {creator.rating.toFixed(1)}
              </Badge>
            </div>
            <p className="text-sm text-white/58">
              {creator.categories.slice(0, 3).join(' • ')}
              <span className="px-2 text-white/25">·</span>
              {creator.city}
            </p>
            <p className="max-w-3xl text-sm leading-6 text-white/58">{creator.bio}</p>
            <div className="flex flex-wrap gap-2">
              {creator.platforms.slice(0, 3).map((platform) => (
                <span key={platform.platform} className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/62">
                  {titleCase(platform.platform)}
                </span>
              ))}
            </div>
            <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-3 lg:min-w-[34rem]">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-white/38" />
                <span className="font-semibold text-white">{formatFollowers(creator.totalFollowers)}</span>
                <span className="text-white/48">followers</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-white/38" />
                <span className="font-semibold text-white">{formatShortRs(budgetValue)}</span>
                <span className="text-white/48">avg rate</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-white/38" />
                <span className="font-semibold text-white">{creator.responseTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-3">
          <Button asChild className="h-11 rounded-2xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500">
            <Link href={`/creator/${creator.username}`}>View profile</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function CreatorGlobalSearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search')?.trim() ?? '';
  const currentTab = (searchParams.get('tab') as SearchTab | null) ?? 'brands';
  const currentSort = (searchParams.get('sort') as SortOption | null) ?? 'relevant';
  const brandFocus = searchParams.get('brand') ?? '';

  const [results, setResults] = useState<CreatorGlobalSearchPayload>({ brands: [], offers: [], creators: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    industries: [],
    contentTypes: [],
    verifiedOnly: false,
    fourStarPlus: false,
    paysOnTime: false,
    budgetRange: DEFAULT_BUDGET_RANGE,
  });

  useEffect(() => {
    let cancelled = false;

    if (!searchTerm) {
      setResults({ brands: [], offers: [], creators: [] });
      setIsLoading(false);
      setHasError(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setHasError(false);

    void getCreatorGlobalSearchResults(searchTerm)
      .then((nextResults) => {
        if (cancelled) return;
        setResults(nextResults);
      })
      .catch(() => {
        if (cancelled) return;
        setResults({ brands: [], offers: [], creators: [] });
        setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  const brandMap = useMemo(
    () => new Map(results.brands.map((brand) => [brand.id, brand] as const)),
    [results.brands],
  );

  const budgetBounds = useMemo<[number, number]>(() => {
    const values = [
      ...results.brands.map((brand) => brand.avgBudget).filter((value) => value > 0),
      ...results.offers.map((offer) => Math.round((offer.budgetMin + offer.budgetMax) / 2)).filter((value) => value > 0),
      ...results.creators.map((creator) => Math.round(((creator.minPrice ?? 0) + (creator.maxPrice ?? creator.minPrice ?? 0)) / 2)).filter((value) => value > 0),
    ];

    if (values.length === 0) return DEFAULT_BUDGET_RANGE;

    const min = Math.max(0, Math.floor(Math.min(...values) / 10000) * 10000);
    const max = Math.max(min + 10000, Math.ceil(Math.max(...values) / 10000) * 10000);
    return [min, max];
  }, [results]);

  useEffect(() => {
    setFilters({
      industries: [],
      contentTypes: [],
      verifiedOnly: false,
      fourStarPlus: false,
      paysOnTime: false,
      budgetRange: budgetBounds,
    });
  }, [budgetBounds, searchTerm]);

  const industryOptions = useMemo(() => {
    const options = new Set<string>(FALLBACK_INDUSTRIES);
    results.brands.forEach((brand) => options.add(brand.industry));
    results.offers.forEach((offer) => offerIndustryTokens(offer).forEach((token) => options.add(token)));
    return Array.from(options).filter(Boolean).slice(0, 8);
  }, [results.brands, results.offers]);

  const contentTypeOptions = useMemo(() => {
    const options = new Set<string>(FALLBACK_CONTENT_TYPES);
    results.offers.forEach((offer) => contentTypeTokens(offer).forEach((token) => options.add(token)));
    return Array.from(options);
  }, [results.offers]);

  const updateParams = useCallback((patch: Partial<Record<'tab' | 'sort' | 'brand', string | null>>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    router.replace(`/creator/offers?${params.toString()}`);
  }, [router, searchParams]);

  const toggleSelection = (key: 'industries' | 'contentTypes', value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((entry) => entry !== value)
        : [...current[key], value],
    }));
  };

  const clearAllFilters = () => {
    setFilters((current) => ({
      ...current,
      industries: [],
      contentTypes: [],
      verifiedOnly: false,
      fourStarPlus: false,
      paysOnTime: false,
      budgetRange: budgetBounds,
    }));
  };

  const filteredBrands = useMemo(() => {
    const [budgetMin, budgetMax] = filters.budgetRange;
    const nextResults = results.brands.filter((brand) => {
      const matchesBudget = brand.avgBudget === 0 || (brand.avgBudget >= budgetMin && brand.avgBudget <= budgetMax);
      if (!matchesBudget) return false;
      if (!brandMatchesIndustry(brand, filters.industries)) return false;
      if (!brandMatchesContentType(brand, filters.contentTypes)) return false;
      if (filters.verifiedOnly && !brand.isVerified) return false;
      if (filters.fourStarPlus && brand.rating < 4) return false;
      return !filters.paysOnTime || brand.paysOnTime;
    });

    return nextResults.sort((left, right) => {
      if (currentSort === 'top-rated') return right.rating - left.rating;
      if (currentSort === 'budget-high') return right.avgBudget - left.avgBudget;
      if (right.matchScore !== left.matchScore) return right.matchScore - left.matchScore;
      return right.rating - left.rating;
    });
  }, [currentSort, filters, results.brands]);

  const filteredOffers = useMemo(() => {
    const [budgetMin, budgetMax] = filters.budgetRange;
    const nextResults = results.offers.filter((offer) => {
      const offerBudget = Math.round((offer.budgetMin + offer.budgetMax) / 2);
      const associatedBrand = Array.from(brandMap.values()).find((brand) => brand.id === offer.brandId || normalize(brand.name) === normalize(offer.brandName));
      if (brandFocus && associatedBrand && associatedBrand.id !== brandFocus) return false;
      if (brandFocus && !associatedBrand && offer.brandId !== brandFocus) return false;
      if (offerBudget > 0 && (offerBudget < budgetMin || offerBudget > budgetMax)) return false;
      if (filters.industries.length > 0) {
        const matchesIndustry = filters.industries.some((industry) => {
          const target = normalize(industry);
          return offerIndustryTokens(offer).some((token) => normalize(token).includes(target))
            || (associatedBrand ? normalize(associatedBrand.industry).includes(target) : false);
        });
        if (!matchesIndustry) return false;
      }
      if (filters.contentTypes.length > 0 && !filters.contentTypes.some((contentType) => contentTypeTokens(offer).includes(contentType))) return false;
      if (filters.verifiedOnly && associatedBrand && !associatedBrand.isVerified) return false;
      if (filters.fourStarPlus && associatedBrand && associatedBrand.rating < 4) return false;
      if (filters.paysOnTime && associatedBrand?.paysOnTime === false) return false;
      return true;
    });

    return nextResults.sort((left, right) => {
      if (currentSort === 'budget-high') return right.budgetMax - left.budgetMax;
      if (currentSort === 'top-rated') {
        const leftBrand = Array.from(brandMap.values()).find((brand) => brand.id === left.brandId || normalize(brand.name) === normalize(left.brandName));
        const rightBrand = Array.from(brandMap.values()).find((brand) => brand.id === right.brandId || normalize(brand.name) === normalize(right.brandName));
        return (rightBrand?.rating ?? 0) - (leftBrand?.rating ?? 0);
      }
      return right.updatedAt.getTime() - left.updatedAt.getTime();
    });
  }, [brandFocus, brandMap, currentSort, filters, results.offers]);

  const filteredCreators = useMemo(() => {
    const [budgetMin, budgetMax] = filters.budgetRange;
    const nextResults = results.creators.filter((creator) => {
      const creatorBudget = Math.round(((creator.minPrice ?? 0) + (creator.maxPrice ?? creator.minPrice ?? 0)) / 2);
      if (creatorBudget > 0 && (creatorBudget < budgetMin || creatorBudget > budgetMax)) return false;
      if (!creatorMatchesIndustry(creator, filters.industries)) return false;
      if (!creatorMatchesContentType(creator, filters.contentTypes)) return false;
      if (filters.verifiedOnly && !creator.isVerified) return false;
      return !filters.fourStarPlus || creator.rating >= 4;
    });

    return nextResults.sort((left, right) => {
      if (currentSort === 'top-rated') return right.rating - left.rating;
      if (currentSort === 'budget-high') return (right.maxPrice ?? right.minPrice ?? 0) - (left.maxPrice ?? left.minPrice ?? 0);
      return right.totalFollowers - left.totalFollowers;
    });
  }, [currentSort, filters, results.creators]);

  const activeOffersFromBrands = useMemo(
    () => dedupeOffers(filteredBrands.flatMap((brand) => brand.activeOffers))
      .filter((offer) => !brandFocus || offer.brandId === brandFocus || normalize(offer.brandName) === normalize(brandMap.get(brandFocus)?.name))
      .slice(0, 4),
    [brandFocus, brandMap, filteredBrands],
  );

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    filters.industries.forEach((industry) => {
      chips.push({
        key: `industry-${industry}`,
        label: industry,
        onClear: () => setFilters((current) => ({ ...current, industries: current.industries.filter((entry) => entry !== industry) })),
      });
    });
    filters.contentTypes.forEach((contentType) => {
      chips.push({
        key: `content-${contentType}`,
        label: contentType,
        onClear: () => setFilters((current) => ({ ...current, contentTypes: current.contentTypes.filter((entry) => entry !== contentType) })),
      });
    });
    if (filters.verifiedOnly) {
      chips.push({ key: 'verified', label: 'Verified only', onClear: () => setFilters((current) => ({ ...current, verifiedOnly: false })) });
    }
    if (filters.fourStarPlus) {
      chips.push({ key: 'four-star', label: '4+ star rating', onClear: () => setFilters((current) => ({ ...current, fourStarPlus: false })) });
    }
    if (filters.paysOnTime) {
      chips.push({ key: 'pays-on-time', label: 'Pays on time', onClear: () => setFilters((current) => ({ ...current, paysOnTime: false })) });
    }
    if (filters.budgetRange[0] !== budgetBounds[0] || filters.budgetRange[1] !== budgetBounds[1]) {
      chips.push({ key: 'budget', label: `${formatShortRs(filters.budgetRange[0])} — ${formatShortRs(filters.budgetRange[1])}`, onClear: () => setFilters((current) => ({ ...current, budgetRange: budgetBounds })) });
    }
    if (brandFocus) {
      chips.push({ key: 'brand-focus', label: `Brand: ${brandMap.get(brandFocus)?.name ?? 'Selected brand'}`, onClear: () => updateParams({ brand: null }) });
    }
    return chips;
  }, [brandFocus, brandMap, budgetBounds, filters, updateParams]);

  const counts = {
    brands: filteredBrands.length,
    offers: filteredOffers.length,
    creators: filteredCreators.length,
  };

  const focusedBrand = brandFocus ? brandMap.get(brandFocus) : undefined;

  return (
    <div className="min-h-[calc(100vh-5.25rem)] bg-[#080909] text-white">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/8 bg-[#090a0a] lg:block">
          <div className="sticky top-[5.25rem] space-y-8 px-5 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/48">Filters</p>
            </div>

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-white/72">Industry</h2>
              </div>
              <div className="space-y-3">
                {industryOptions.map((industry) => (
                  <label key={industry} className="flex cursor-pointer items-center gap-3 text-sm text-white/78">
                    <Checkbox
                      checked={filters.industries.includes(industry)}
                      onCheckedChange={() => toggleSelection('industries', industry)}
                      className="size-4 rounded-md border-white/18 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                    />
                    <span className={cn(filters.industries.includes(industry) && 'text-emerald-300')}>{industry}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-semibold text-white/72">Brand reputation</h2>
              <div className="space-y-3">
                {[
                  { key: 'verifiedOnly', label: 'Verified only' },
                  { key: 'fourStarPlus', label: '4+ star rating' },
                  { key: 'paysOnTime', label: 'Pays on time' },
                ].map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-center gap-3 text-sm text-white/78">
                    <Checkbox
                      checked={filters[item.key as 'verifiedOnly' | 'fourStarPlus' | 'paysOnTime']}
                      onCheckedChange={() =>
                        setFilters((current) => ({
                          ...current,
                          [item.key]: !current[item.key as 'verifiedOnly' | 'fourStarPlus' | 'paysOnTime'],
                        }))
                      }
                      className="size-4 rounded-md border-white/18 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                    />
                    <span className={cn(filters[item.key as 'verifiedOnly' | 'fourStarPlus' | 'paysOnTime'] as boolean && 'text-emerald-300')}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-semibold text-white/72">Budget range</h2>
              <div className="space-y-4 pr-2">
                <Slider
                  value={filters.budgetRange}
                  min={budgetBounds[0]}
                  max={budgetBounds[1]}
                  step={5000}
                  minStepsBetweenThumbs={1}
                  onValueChange={(value) => {
                    if (value.length !== 2) return;
                    setFilters((current) => ({
                      ...current,
                      budgetRange: [value[0], value[1]],
                    }));
                  }}
                  className="[&_[data-slot=slider-range]]:bg-emerald-400 [&_[data-slot=slider-thumb]]:border-emerald-400 [&_[data-slot=slider-thumb]]:bg-emerald-400 [&_[data-slot=slider-track]]:bg-white/14"
                />
                <div className="flex items-center justify-between text-sm text-white/48">
                  <span>{formatShortRs(filters.budgetRange[0])}</span>
                  <span>{formatShortRs(filters.budgetRange[1])}</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-base font-semibold text-white/72">Content type</h2>
              <div className="space-y-3">
                {contentTypeOptions.map((contentType) => (
                  <label key={contentType} className="flex cursor-pointer items-center gap-3 text-sm text-white/78">
                    <Checkbox
                      checked={filters.contentTypes.includes(contentType)}
                      onCheckedChange={() => toggleSelection('contentTypes', contentType)}
                      className="size-4 rounded-md border-white/18 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                    />
                    <span className={cn(filters.contentTypes.includes(contentType) && 'text-emerald-300')}>{contentType}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 border-b border-white/8 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/50">
                <h1 className="text-lg font-semibold text-white/58 md:text-xl">
                  Showing results for <span className="font-semibold text-white">“{searchTerm}”</span>
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span>Sort:</span>
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateParams({ sort: option.value, brand: currentTab === 'brands' ? brandFocus || null : brandFocus || null })}
                      className={cn(
                        'rounded-2xl border px-4 py-2 text-sm font-medium transition',
                        currentSort === option.value
                          ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300'
                          : 'border-white/10 text-white/58 hover:border-white/20 hover:text-white',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <Card className="rounded-[28px] border-white/8 bg-white/[0.04] text-white shadow-none">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-white/40">Filters</p>
                      <p className="text-lg font-semibold text-white">Quick refine</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={clearAllFilters}
                      className="rounded-full text-white/55 hover:bg-white/8 hover:text-white"
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {industryOptions.slice(0, 4).map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => toggleSelection('industries', industry)}
                        className={cn(
                          'rounded-2xl border px-4 py-3 text-left text-sm transition',
                          filters.industries.includes(industry)
                            ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300'
                            : 'border-white/10 text-white/62 hover:border-white/18 hover:text-white',
                        )}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center gap-6 border-b border-white/8 pb-5">
              {(['brands', 'offers', 'creators'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => updateParams({ tab, brand: tab === 'offers' ? brandFocus || null : tab === 'brands' ? brandFocus || null : null })}
                  className={cn(
                    'relative inline-flex items-center gap-3 pb-2 text-lg font-semibold tracking-[-0.01em] transition',
                    currentTab === tab ? 'text-emerald-300' : 'text-white/45 hover:text-white/78',
                  )}
                >
                  <span>{titleCase(tab)}</span>
                  <ResultCountBadge count={counts[tab]} />
                  <span
                    className={cn(
                      'absolute inset-x-0 -bottom-[21px] h-[3px] rounded-full transition',
                      currentTab === tab ? 'bg-emerald-400' : 'bg-transparent',
                    )}
                  />
                </button>
              ))}
            </div>

            {activeFilterChips.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.onClear}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/72 transition hover:bg-white/[0.08]"
                  >
                    <span>{chip.label}</span>
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearAllFilters}
                  className="rounded-full text-white/55 hover:bg-white/8 hover:text-white"
                >
                  Clear all
                </Button>
              </div>
            ) : null}

            {focusedBrand && currentTab === 'offers' ? (
              <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/[0.08] px-5 py-4 text-white/76">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.16em] text-emerald-200/55">Focused brand</p>
                    <p className="text-lg font-semibold text-white">Showing offers from {focusedBrand.name}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => updateParams({ brand: null })}
                    className="rounded-full text-white/62 hover:bg-white/8 hover:text-white"
                  >
                    Clear focus
                  </Button>
                </div>
              </div>
            ) : null}

            {isLoading ? (
              <SearchResultsSkeleton />
            ) : hasError ? (
              <EmptyState
                title="We couldn’t load search results"
                description="The search experience is ready, but the results service didn’t respond this time. Please try again in a moment."
              />
            ) : currentTab === 'brands' ? (
              filteredBrands.length === 0 ? (
                <EmptyState
                  title="No brands match these filters"
                  description="Try removing one or two filters to see more brand opportunities for this search."
                  onReset={clearAllFilters}
                />
              ) : (
                <div className="space-y-5">
                  {filteredBrands.map((brand) => (
                    <BrandResultCard
                      key={brand.id}
                      brand={brand}
                      isFocused={brandFocus === brand.id}
                      onViewOffers={(brandId) => updateParams({ tab: 'offers', brand: brandId })}
                      onClearBrandFocus={() => updateParams({ brand: null })}
                    />
                  ))}

                  {activeOffersFromBrands.length > 0 ? (
                    <section className="space-y-4 pt-3">
                      <div>
                        <p className="text-[1.55rem] font-semibold tracking-[-0.03em] text-white/36">Active offers from these brands</p>
                      </div>
                      <div className="space-y-4">
                        {activeOffersFromBrands.map((offer) => {
                          const brand = filteredBrands.find((entry) => entry.id === offer.brandId || normalize(entry.name) === normalize(offer.brandName));
                          return <OfferResultCard key={offer.id} offer={offer} brand={brand} compact />;
                        })}
                      </div>
                    </section>
                  ) : null}
                </div>
              )
            ) : currentTab === 'offers' ? (
              filteredOffers.length === 0 ? (
                <EmptyState
                  title="No offers match these filters"
                  description="Try a broader budget or remove a content type to surface more open campaigns."
                  onReset={clearAllFilters}
                />
              ) : (
                <div className="space-y-4">
                  {filteredOffers.map((offer) => {
                    const brand = filteredBrands.find((entry) => entry.id === offer.brandId || normalize(entry.name) === normalize(offer.brandName))
                      ?? results.brands.find((entry) => entry.id === offer.brandId || normalize(entry.name) === normalize(offer.brandName));
                    return <OfferResultCard key={offer.id} offer={offer} brand={brand} />;
                  })}
                </div>
              )
            ) : filteredCreators.length === 0 ? (
              <EmptyState
                title="No creators match these filters"
                description="Broaden the industry or content type filters to discover more creator matches."
                onReset={clearAllFilters}
              />
            ) : (
              <div className="space-y-4">
                {filteredCreators.map((creator) => (
                  <CreatorResultCard key={creator.id} creator={creator} />
                ))}
              </div>
            )}

            {!isLoading && !hasError && currentTab === 'brands' && counts.brands > 0 ? (
              <div className="rounded-[28px] border border-white/8 bg-white/[0.04] px-5 py-4 text-sm text-white/48">
                Search blends real offer results with curated brand context so creators can move from discovery to application without losing the original feed experience.
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

