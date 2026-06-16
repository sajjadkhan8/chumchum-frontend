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
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn, formatFollowers, formatPrice, formatRelativeTime } from '@/lib/utils';
import { getCreatorGlobalSearchResults, type CreatorGlobalSearchResults as CreatorGlobalSearchPayload, type CreatorSearchBrandResult } from '@/lib/search/creator-search';
import type { BrandCampaign, Creator } from '@/types';

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
  if (amount >= 1000000) return `Rs ${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1)}M`;
  if (amount >= 1000) return `Rs ${(amount / 1000).toFixed(amount >= 100000 ? 0 : 1)}k`;
  return `Rs ${amount}`;
};

const titleCase = (value: string) => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const contentTypeTokens = (offer: BrandCampaign) => {
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

const offerIndustryTokens = (offer: BrandCampaign) => {
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

const offerDaysLeft = (offer: BrandCampaign) => {
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

const compactOfferBudget = (offer: BrandCampaign) => {
  const average = Math.round((offer.budgetMin + offer.budgetMax) / 2);
  return average > 0 ? formatShortRs(average) : formatPrice(offer.budgetMax || offer.budgetMin || 0);
};

const dedupeOffers = (offers: BrandCampaign[]) => {
  const seen = new Set<string>();
  return offers.filter((offer) => {
    if (seen.has(offer.id)) return false;
    seen.add(offer.id);
    return true;
  });
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-[1.4rem] border border-[#d1ddd6] bg-white p-5 shadow-[0_8px_28px_rgba(38,70,50,0.06)]">
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-xl bg-[#e8ede9]" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-40 rounded-full bg-[#e8ede9]" />
              <div className="h-4 w-72 rounded-full bg-[#e8ede9]" />
              <div className="flex gap-2">
                <div className="h-7 w-20 rounded-full bg-[#e8ede9]" />
                <div className="h-7 w-24 rounded-full bg-[#e8ede9]" />
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="h-10 rounded-xl bg-[#e8ede9]" />
            <div className="h-10 rounded-xl bg-[#e8ede9]" />
            <div className="h-10 rounded-xl bg-[#e8ede9]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description, onReset }: { title: string; description: string; onReset?: () => void }) {
  return (
    <div className="rounded-[1.4rem] border border-[#d1ddd6] bg-white p-12 text-center shadow-[0_8px_28px_rgba(38,70,50,0.06)]">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#e6eceb] text-[#2d6b4e]">
        <Search className="size-5" />
      </div>
      <h3 className="mb-1 text-lg font-extrabold text-[#1e3d2e]">{title}</h3>
      <p className="mx-auto max-w-sm text-sm text-[#87938b]">{description}</p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 h-9 rounded-full border-2 border-[#d1ddd6] px-5 text-sm font-bold text-[#87938b] transition-colors hover:border-[#b0c5ba] hover:text-[#1e3d2e]"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}

function ResultCountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-[#e8ede9] px-2.5 py-0.5 text-xs font-bold text-[#87938b]">
      {count}
    </span>
  );
}

function BrandInitials({ initials }: { initials: string }) {
  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-[#d1ddd6] bg-[#e6eceb] text-lg font-extrabold text-[#2d6b4e]">
      {initials}
    </div>
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
        'rounded-[1.4rem] border bg-white p-5 sm:p-6 shadow-[0_8px_28px_rgba(38,70,50,0.06)] transition-all',
        isFocused ? 'border-[#2d6b4e]' : 'border-[#d1ddd6] hover:border-[#b0c5ba] hover:shadow-[0_12px_36px_rgba(38,70,50,0.10)]',
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <BrandInitials initials={brand.initials} />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-extrabold tracking-[-0.04em] text-[#1e3d2e]">{brand.name}</h3>
              {brand.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2d6b4e] px-2.5 py-0.5 text-[10px] font-bold text-white">
                  <CheckCircle2 className="size-3" /> Verified
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border border-[#e8c98a] bg-[#fdf3dc] px-2.5 py-0.5 text-[10px] font-bold text-[#9b6712]">
                <Star className="size-3 fill-current" /> {brand.rating.toFixed(1)}
                {brand.paysOnTime && <span className="ml-1">· Pays on time</span>}
              </span>
            </div>

            <p className="text-xs text-[#87938b]">
              {brand.industry}
              <span className="px-1.5 text-[#d1ddd6]">·</span>
              {brand.city}
              <span className="px-1.5 text-[#d1ddd6]">·</span>
              {brand.campaignCount} campaigns run
            </p>

            {brand.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {brand.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#d1ddd6] bg-[#f4f7f5] px-2.5 py-0.5 text-xs text-[#87938b]">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[32rem]">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-[#b0bfb8]" />
                <span className="text-xs text-[#87938b]">Avg budget</span>
                <span className="text-sm font-bold text-[#1e3d2e]">{formatShortRs(brand.avgBudget)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-[#b0bfb8]" />
                <span className="text-sm font-bold text-[#1e3d2e]">{brand.creatorsHired}</span>
                <span className="text-xs text-[#87938b]">hired</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-[#b0bfb8]" />
                <span className="text-xs text-[#87938b]">Replies in</span>
                <span className="text-sm font-bold text-[#1e3d2e]">{brand.replyTimeLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:w-40">
          <button
            type="button"
            onClick={() => onViewOffers(brand.id)}
            className="h-10 rounded-full bg-[#2d6b4e] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
          >
            View offers
          </button>
          {brand.website ? (
            <a
              href={brand.website}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center justify-center rounded-full border-2 border-[#d1ddd6] px-4 text-sm font-bold text-[#1e3d2e] transition-colors hover:border-[#b0c5ba]"
            >
              View profile
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="h-10 rounded-full border-2 border-[#d1ddd6] px-4 text-sm font-bold text-[#b0bfb8]"
            >
              View profile
            </button>
          )}
          {isFocused && (
            <button
              type="button"
              onClick={onClearBrandFocus}
              className="h-9 rounded-full px-4 text-sm text-[#87938b] transition-colors hover:bg-[#f4f7f5] hover:text-[#1e3d2e]"
            >
              Clear focus
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function OfferResultCard({ offer, brand, compact = false }: { offer: BrandCampaign; brand?: CreatorSearchBrandResult; compact?: boolean }) {
  const deadlineLabel = offerDaysLeft(offer);
  const contentTypes = contentTypeTokens(offer);
  const brandInitials = brand?.initials ?? offer.brandName.slice(0, 2).toUpperCase();

  return (
    <article className={cn('rounded-[1.4rem] border border-[#d1ddd6] bg-white shadow-[0_8px_28px_rgba(38,70,50,0.06)]', compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#d1ddd6] bg-[#e6eceb] text-base font-extrabold text-[#2d6b4e]">
            {brandInitials}
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#87938b]">
              <span className="font-semibold text-[#496159]">{offer.brandName}</span>
              {brand?.isVerified && <CheckCircle2 className="size-3.5 text-[#2d6b4e]" />}
            </div>
            <h3 className={cn('font-extrabold tracking-[-0.03em] text-[#1e3d2e]', compact ? 'text-lg' : 'text-xl')}>
              {offer.title}
            </h3>
            <p className={cn('max-w-3xl text-[#87938b]', compact ? 'text-xs leading-5' : 'text-sm leading-6')}>
              {offer.brief}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:min-w-[9rem] sm:items-end">
          <Link
            href={`/creator/offers/${offer.id}`}
            className="flex h-10 items-center justify-center rounded-full bg-[#2d6b4e] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
          >
            Apply now
          </Link>
          <Link
            href={`/creator/offers/${offer.id}`}
            className="flex h-10 items-center justify-center rounded-full border-2 border-[#d1ddd6] px-4 text-sm font-bold text-[#1e3d2e] transition-colors hover:border-[#b0c5ba]"
          >
            View details
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#87938b]">
        <span className="text-lg font-extrabold tracking-[-0.03em] text-[#2d6b4e]">{compactOfferBudget(offer)}</span>
        {deadlineLabel && (
          <span className="inline-flex items-center gap-1.5 font-medium text-[#9b6712]">
            <Clock3 className="size-3.5" /> {deadlineLabel}
          </span>
        )}
        {offer.maxApplicants && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> {offer.maxApplicants} spots left
          </span>
        )}
        {contentTypes[0] && (
          <span className="inline-flex items-center gap-1.5">
            <Play className="size-3.5" /> {contentTypes[0]}
          </span>
        )}
        <span>Updated {formatRelativeTime(offer.updatedAt)}</span>
      </div>
    </article>
  );
}

function CreatorResultCard({ creator }: { creator: Creator }) {
  const budgetValue = Math.round(((creator.minPrice ?? 0) + (creator.maxPrice ?? creator.minPrice ?? 0)) / 2);

  return (
    <article className="rounded-[1.4rem] border border-[#d1ddd6] bg-white p-5 sm:p-6 shadow-[0_8px_28px_rgba(38,70,50,0.06)] transition-all hover:border-[#b0c5ba] hover:shadow-[0_12px_36px_rgba(38,70,50,0.10)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="size-14 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-extrabold tracking-[-0.04em] text-[#1e3d2e]">{creator.name}</h3>
              {creator.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2d6b4e] px-2.5 py-0.5 text-[10px] font-bold text-white">
                  <CheckCircle2 className="size-3" /> Verified
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border border-[#e8c98a] bg-[#fdf3dc] px-2.5 py-0.5 text-[10px] font-bold text-[#9b6712]">
                <Star className="size-3 fill-current" /> {creator.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-[#87938b]">
              {creator.categories.slice(0, 3).join(' • ')}
              <span className="px-1.5 text-[#d1ddd6]">·</span>
              {creator.city}
            </p>
            <p className="max-w-2xl text-sm leading-6 text-[#87938b]">{creator.bio}</p>
            <div className="flex flex-wrap gap-1.5">
              {creator.platforms.slice(0, 3).map((platform) => (
                <span key={platform.platform} className="rounded-full border border-[#d1ddd6] bg-[#f4f7f5] px-2.5 py-0.5 text-xs text-[#87938b]">
                  {titleCase(platform.platform)}
                </span>
              ))}
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[32rem]">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-[#b0bfb8]" />
                <span className="text-sm font-bold text-[#1e3d2e]">{formatFollowers(creator.totalFollowers)}</span>
                <span className="text-xs text-[#87938b]">followers</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-[#b0bfb8]" />
                <span className="text-sm font-bold text-[#1e3d2e]">{formatShortRs(budgetValue)}</span>
                <span className="text-xs text-[#87938b]">avg rate</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-[#b0bfb8]" />
                <span className="text-sm font-bold text-[#1e3d2e]">{creator.responseTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <Link
            href={`/creator/${creator.username}`}
            className="flex h-10 items-center justify-center rounded-full bg-[#2d6b4e] px-5 text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
          >
            View profile
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function CreatorGlobalSearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q')?.trim() ?? '';
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
      return () => { cancelled = true; };
    }

    setIsLoading(true);
    setHasError(false);

    void getCreatorGlobalSearchResults(searchTerm)
      .then((nextResults) => { if (!cancelled) setResults(nextResults); })
      .catch(() => { if (!cancelled) { setResults({ brands: [], offers: [], creators: [] }); setHasError(true); } })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [searchTerm]);

  const brandMap = useMemo(
    () => new Map(results.brands.map((brand) => [brand.id, brand] as const)),
    [results.brands],
  );

  const budgetBounds = useMemo<[number, number]>(() => {
    const values = [
      ...results.brands.map((b) => b.avgBudget).filter((v) => v > 0),
      ...results.offers.map((o) => Math.round((o.budgetMin + o.budgetMax) / 2)).filter((v) => v > 0),
      ...results.creators.map((c) => Math.round(((c.minPrice ?? 0) + (c.maxPrice ?? c.minPrice ?? 0)) / 2)).filter((v) => v > 0),
    ];
    if (values.length === 0) return DEFAULT_BUDGET_RANGE;
    const min = Math.max(0, Math.floor(Math.min(...values) / 10000) * 10000);
    const max = Math.max(min + 10000, Math.ceil(Math.max(...values) / 10000) * 10000);
    return [min, max];
  }, [results]);

  useEffect(() => {
    setFilters({ industries: [], contentTypes: [], verifiedOnly: false, fourStarPlus: false, paysOnTime: false, budgetRange: budgetBounds });
  }, [budgetBounds, searchTerm]);

  const industryOptions = useMemo(() => {
    const options = new Set<string>(FALLBACK_INDUSTRIES);
    results.brands.forEach((b) => options.add(b.industry));
    results.offers.forEach((o) => offerIndustryTokens(o).forEach((t) => options.add(t)));
    return Array.from(options).filter(Boolean).slice(0, 8);
  }, [results.brands, results.offers]);

  const contentTypeOptions = useMemo(() => {
    const options = new Set<string>(FALLBACK_CONTENT_TYPES);
    results.offers.forEach((o) => contentTypeTokens(o).forEach((t) => options.add(t)));
    return Array.from(options);
  }, [results.offers]);

  const updateParams = useCallback((patch: Partial<Record<'tab' | 'sort' | 'brand', string | null>>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    router.replace(`/creator/search?${params.toString()}`);
  }, [router, searchParams]);

  const toggleSelection = (key: 'industries' | 'contentTypes', value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((e) => e !== value) : [...current[key], value],
    }));
  };

  const clearAllFilters = () => {
    setFilters((current) => ({ ...current, industries: [], contentTypes: [], verifiedOnly: false, fourStarPlus: false, paysOnTime: false, budgetRange: budgetBounds }));
  };

  const filteredBrands = useMemo(() => {
    const [budgetMin, budgetMax] = filters.budgetRange;
    return results.brands
      .filter((brand) => {
        if (brand.avgBudget > 0 && (brand.avgBudget < budgetMin || brand.avgBudget > budgetMax)) return false;
        if (!brandMatchesIndustry(brand, filters.industries)) return false;
        if (!brandMatchesContentType(brand, filters.contentTypes)) return false;
        if (filters.verifiedOnly && !brand.isVerified) return false;
        if (filters.fourStarPlus && brand.rating < 4) return false;
        return !filters.paysOnTime || brand.paysOnTime;
      })
      .sort((l, r) => {
        if (currentSort === 'top-rated') return r.rating - l.rating;
        if (currentSort === 'budget-high') return r.avgBudget - l.avgBudget;
        if (r.matchScore !== l.matchScore) return r.matchScore - l.matchScore;
        return r.rating - l.rating;
      });
  }, [currentSort, filters, results.brands]);

  const filteredOffers = useMemo(() => {
    const [budgetMin, budgetMax] = filters.budgetRange;
    return results.offers
      .filter((offer) => {
        const offerBudget = Math.round((offer.budgetMin + offer.budgetMax) / 2);
        const assoc = Array.from(brandMap.values()).find((b) => b.id === offer.brandId || normalize(b.name) === normalize(offer.brandName));
        if (brandFocus && assoc && assoc.id !== brandFocus) return false;
        if (brandFocus && !assoc && offer.brandId !== brandFocus) return false;
        if (offerBudget > 0 && (offerBudget < budgetMin || offerBudget > budgetMax)) return false;
        if (filters.industries.length > 0) {
          const matches = filters.industries.some((ind) => {
            const target = normalize(ind);
            return offerIndustryTokens(offer).some((t) => normalize(t).includes(target)) || (assoc ? normalize(assoc.industry).includes(target) : false);
          });
          if (!matches) return false;
        }
        if (filters.contentTypes.length > 0 && !filters.contentTypes.some((ct) => contentTypeTokens(offer).includes(ct))) return false;
        if (filters.verifiedOnly && assoc && !assoc.isVerified) return false;
        if (filters.fourStarPlus && assoc && assoc.rating < 4) return false;
        if (filters.paysOnTime && assoc?.paysOnTime === false) return false;
        return true;
      })
      .sort((l, r) => {
        if (currentSort === 'budget-high') return r.budgetMax - l.budgetMax;
        if (currentSort === 'top-rated') {
          const lb = Array.from(brandMap.values()).find((b) => b.id === l.brandId || normalize(b.name) === normalize(l.brandName));
          const rb = Array.from(brandMap.values()).find((b) => b.id === r.brandId || normalize(b.name) === normalize(r.brandName));
          return (rb?.rating ?? 0) - (lb?.rating ?? 0);
        }
        return r.updatedAt.getTime() - l.updatedAt.getTime();
      });
  }, [brandFocus, brandMap, currentSort, filters, results.offers]);

  const filteredCreators = useMemo(() => {
    const [budgetMin, budgetMax] = filters.budgetRange;
    return results.creators
      .filter((creator) => {
        const budget = Math.round(((creator.minPrice ?? 0) + (creator.maxPrice ?? creator.minPrice ?? 0)) / 2);
        if (budget > 0 && (budget < budgetMin || budget > budgetMax)) return false;
        if (!creatorMatchesIndustry(creator, filters.industries)) return false;
        if (!creatorMatchesContentType(creator, filters.contentTypes)) return false;
        if (filters.verifiedOnly && !creator.isVerified) return false;
        return !filters.fourStarPlus || creator.rating >= 4;
      })
      .sort((l, r) => {
        if (currentSort === 'top-rated') return r.rating - l.rating;
        if (currentSort === 'budget-high') return (r.maxPrice ?? r.minPrice ?? 0) - (l.maxPrice ?? l.minPrice ?? 0);
        return r.totalFollowers - l.totalFollowers;
      });
  }, [currentSort, filters, results.creators]);

  const activeOffersFromBrands = useMemo(
    () => dedupeOffers(filteredBrands.flatMap((b) => b.activeOffers))
      .filter((o) => !brandFocus || o.brandId === brandFocus || normalize(o.brandName) === normalize(brandMap.get(brandFocus)?.name))
      .slice(0, 4),
    [brandFocus, brandMap, filteredBrands],
  );

  const counts = { brands: filteredBrands.length, offers: filteredOffers.length, creators: filteredCreators.length };
  const focusedBrand = brandFocus ? brandMap.get(brandFocus) : undefined;

  // ─── Sidebar ────────────────────────────────────────────────────────────────

  const SidebarContent = (
    <div className="space-y-7">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Filters</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#7a8f82]">Industry</h2>
        <div className="space-y-2.5">
          {industryOptions.map((industry) => (
            <label key={industry} className="flex cursor-pointer items-center gap-3 text-sm text-[#496159]">
              <Checkbox
                checked={filters.industries.includes(industry)}
                onCheckedChange={() => toggleSelection('industries', industry)}
                className="size-4 rounded-[3px] border-[#d1ddd6] data-[state=checked]:border-[#2d6b4e] data-[state=checked]:bg-[#2d6b4e]"
              />
              <span className={cn(filters.industries.includes(industry) && 'font-bold text-[#2d6b4e]')}>{industry}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#7a8f82]">Brand reputation</h2>
        <div className="space-y-2.5">
          {[
            { key: 'verifiedOnly', label: 'Verified only' },
            { key: 'fourStarPlus', label: '4+ star rating' },
            { key: 'paysOnTime', label: 'Pays on time' },
          ].map((item) => (
            <label key={item.key} className="flex cursor-pointer items-center gap-3 text-sm text-[#496159]">
              <Checkbox
                checked={filters[item.key as 'verifiedOnly' | 'fourStarPlus' | 'paysOnTime']}
                onCheckedChange={() =>
                  setFilters((c) => ({ ...c, [item.key]: !c[item.key as 'verifiedOnly' | 'fourStarPlus' | 'paysOnTime'] }))
                }
                className="size-4 rounded-[3px] border-[#d1ddd6] data-[state=checked]:border-[#2d6b4e] data-[state=checked]:bg-[#2d6b4e]"
              />
              <span className={cn((filters[item.key as 'verifiedOnly' | 'fourStarPlus' | 'paysOnTime'] as boolean) && 'font-bold text-[#2d6b4e]')}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#7a8f82]">Budget range</h2>
        <div className="space-y-4 pr-2">
          <Slider
            value={filters.budgetRange}
            min={budgetBounds[0]}
            max={budgetBounds[1]}
            step={5000}
            minStepsBetweenThumbs={1}
            onValueChange={(value) => {
              if (value.length !== 2) return;
              setFilters((c) => ({ ...c, budgetRange: [value[0], value[1]] }));
            }}
            className="[&_[data-slot=slider-range]]:bg-[#2d6b4e] [&_[data-slot=slider-thumb]]:border-[#2d6b4e] [&_[data-slot=slider-thumb]]:bg-[#2d6b4e] [&_[data-slot=slider-track]]:bg-[#e8ede9]"
          />
          <div className="flex items-center justify-between text-xs text-[#87938b]">
            <span>{formatShortRs(filters.budgetRange[0])}</span>
            <span>{formatShortRs(filters.budgetRange[1])}</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#7a8f82]">Content type</h2>
        <div className="space-y-2.5">
          {contentTypeOptions.map((contentType) => (
            <label key={contentType} className="flex cursor-pointer items-center gap-3 text-sm text-[#496159]">
              <Checkbox
                checked={filters.contentTypes.includes(contentType)}
                onCheckedChange={() => toggleSelection('contentTypes', contentType)}
                className="size-4 rounded-[3px] border-[#d1ddd6] data-[state=checked]:border-[#2d6b4e] data-[state=checked]:bg-[#2d6b4e]"
              />
              <span className={cn(filters.contentTypes.includes(contentType) && 'font-bold text-[#2d6b4e]')}>{contentType}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-5.25rem)] bg-[#fbfaf5] text-[#1e3d2e]">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[272px_minmax(0,1fr)]">

        {/* Desktop sidebar */}
        <aside className="hidden border-r border-[#d1ddd6] bg-white lg:block">
          <div className="sticky top-[5.25rem] px-5 py-6">
            {SidebarContent}
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-5">

            {/* Heading + sort */}
            <div className="flex flex-col gap-4 border-b border-[#d1ddd6] pb-5 xl:flex-row xl:items-center xl:justify-between">
              <h1 className="text-lg font-extrabold tracking-[-0.03em] text-[#87938b]">
                Results for <span className="text-[#1e3d2e]">"{searchTerm}"</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-xs font-bold uppercase tracking-widest text-[#7a8f82]">Sort:</span>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateParams({ sort: option.value })}
                    className={cn(
                      'rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition',
                      currentSort === option.value
                        ? 'border-[#2d6b4e] bg-[#e4f1e8] text-[#1e3d2e]'
                        : 'border-[#d1ddd6] text-[#87938b] hover:border-[#b0c5ba] hover:text-[#1e3d2e]',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile quick filters */}
            <div className="lg:hidden">
              <div className="rounded-[1.4rem] border border-[#d1ddd6] bg-white p-5 shadow-[0_8px_28px_rgba(38,70,50,0.06)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Quick refine</p>
                    <p className="text-base font-extrabold text-[#1e3d2e]">Filters</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="rounded-full border border-[#d1ddd6] px-3 py-1 text-xs font-bold text-[#87938b] transition-colors hover:border-[#b0c5ba] hover:text-[#1e3d2e]"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {industryOptions.slice(0, 4).map((industry) => (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => toggleSelection('industries', industry)}
                      className={cn(
                        'rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition',
                        filters.industries.includes(industry)
                          ? 'border-[#2d6b4e] bg-[#e4f1e8] text-[#1e3d2e]'
                          : 'border-[#d1ddd6] text-[#87938b] hover:border-[#b0c5ba] hover:text-[#1e3d2e]',
                      )}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab strip */}
            <div className="flex items-center gap-6 border-b border-[#d1ddd6] pb-0">
              {(['brands', 'offers', 'creators'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => updateParams({ tab, brand: tab === 'brands' || tab === 'offers' ? brandFocus || null : null })}
                  className={cn(
                    'relative inline-flex items-center gap-2 pb-3 text-sm font-bold tracking-[-0.01em] transition',
                    currentTab === tab ? 'text-[#2d6b4e]' : 'text-[#87938b] hover:text-[#496159]',
                  )}
                >
                  <span>{titleCase(tab)}</span>
                  <ResultCountBadge count={counts[tab]} />
                  <span
                    className={cn(
                      'absolute inset-x-0 -bottom-px h-[2.5px] rounded-full transition',
                      currentTab === tab ? 'bg-[#2d6b4e]' : 'bg-transparent',
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Focused brand banner */}
            {focusedBrand && currentTab === 'offers' && (
              <div className="flex flex-col gap-2 rounded-2xl border border-[#c2dac9] bg-[#e4f1e8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Focused brand</p>
                  <p className="text-base font-extrabold text-[#1e3d2e]">Showing offers from {focusedBrand.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateParams({ brand: null })}
                  className="h-8 self-start rounded-full border border-[#d1ddd6] bg-white px-4 text-sm font-bold text-[#87938b] transition-colors hover:border-[#b0c5ba] hover:text-[#1e3d2e] sm:self-auto"
                >
                  Clear focus
                </button>
              </div>
            )}

            {/* Results */}
            {isLoading ? (
              <SearchResultsSkeleton />
            ) : hasError ? (
              <EmptyState
                title="Couldn't load results"
                description="The search service didn't respond. Please try again in a moment."
              />
            ) : currentTab === 'brands' ? (
              filteredBrands.length === 0 ? (
                <EmptyState title="No brands match these filters" description="Try removing one or two filters to see more brand opportunities." onReset={clearAllFilters} />
              ) : (
                <div className="space-y-4">
                  {filteredBrands.map((brand) => (
                    <BrandResultCard
                      key={brand.id}
                      brand={brand}
                      isFocused={brandFocus === brand.id}
                      onViewOffers={(brandId) => updateParams({ tab: 'offers', brand: brandId })}
                      onClearBrandFocus={() => updateParams({ brand: null })}
                    />
                  ))}
                  {activeOffersFromBrands.length > 0 && (
                    <section className="space-y-4 pt-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Active offers from these brands</p>
                      <div className="space-y-3">
                        {activeOffersFromBrands.map((offer) => {
                          const brand = filteredBrands.find((b) => b.id === offer.brandId || normalize(b.name) === normalize(offer.brandName));
                          return <OfferResultCard key={offer.id} offer={offer} brand={brand} compact />;
                        })}
                      </div>
                    </section>
                  )}
                </div>
              )
            ) : currentTab === 'offers' ? (
              filteredOffers.length === 0 ? (
                <EmptyState title="No offers match these filters" description="Try a broader budget or remove a content type to surface more open campaigns." onReset={clearAllFilters} />
              ) : (
                <div className="space-y-4">
                  {filteredOffers.map((offer) => {
                    const brand = filteredBrands.find((b) => b.id === offer.brandId || normalize(b.name) === normalize(offer.brandName))
                      ?? results.brands.find((b) => b.id === offer.brandId || normalize(b.name) === normalize(offer.brandName));
                    return <OfferResultCard key={offer.id} offer={offer} brand={brand} />;
                  })}
                </div>
              )
            ) : filteredCreators.length === 0 ? (
              <EmptyState title="No creators match these filters" description="Broaden the industry or content type filters to discover more creator matches." onReset={clearAllFilters} />
            ) : (
              <div className="space-y-4">
                {filteredCreators.map((creator) => (
                  <CreatorResultCard key={creator.id} creator={creator} />
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
