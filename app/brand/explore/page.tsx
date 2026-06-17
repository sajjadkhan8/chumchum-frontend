'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Star, Wallet, MapPin, Crown, Heart, Grid, List, Sparkles, SlidersHorizontal, Users, ArrowRight, CalendarClock } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreatorCard } from '@/components/creator-card';
import { FilterPanel } from '@/components/filter-panel';
import { QuickDealModal } from '@/components/quick-deal-modal';
import { CreatorCardSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { useFilterStore } from '@/store/filter-store';
import { useAuthStore } from '@/store/auth-store';
import { creatorsService } from '@/services/creators.service';
import { savedCreatorsService } from '@/services/saved-creators.service';
import { ambassadorService } from '@/services/ambassador.service';
import { packagesService } from '@/services/packages.service';
import type { Creator, DealType, Package, PlatformAmbassador } from '@/types';
import { cn, formatFollowers, formatPrice } from '@/lib/utils';
import Link from 'next/link';

const sortOptions = [
  { value: 'trending', label: 'Trending', icon: TrendingUp },
  { value: 'budget_friendly', label: 'Budget Friendly', icon: Wallet },
  { value: 'top_rated', label: 'Top Rated', icon: Star },
  { value: 'near_you', label: 'By City (A–Z)', icon: MapPin },
];

function HeroStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-[1.15rem] border border-white/12 bg-white/8 px-2.5 py-2.5 backdrop-blur sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden size-9 shrink-0 place-items-center rounded-2xl bg-[#e6aa38] text-[#173b2a] sm:grid">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#d4e0d8] sm:text-[10px] sm:tracking-[0.15em]">{label}</p>
          <p className="mt-0.5 truncate text-base font-black tracking-[-0.04em] text-white sm:text-lg">{value}</p>
        </div>
      </div>
    </div>
  );
}

function profileImageUrl(person: Creator) {
  return person.contentPreviews[0]?.thumbnail || person.coverImage || person.avatar;
}

function AmbassadorRow({ ambassador }: { ambassador: PlatformAmbassador }) {
  return (
    <article className="group overflow-hidden rounded-[1.45rem] border border-[#d9e0d8] bg-white shadow-[0_14px_45px_rgba(38,70,50,0.055)] transition hover:-translate-y-0.5 hover:border-[#b7c8bd] hover:shadow-[0_22px_70px_rgba(38,70,50,0.10)]">
      <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)_190px]">
        <div className="relative min-h-[190px] overflow-hidden md:min-h-full">
          <Image
            src={profileImageUrl(ambassador)}
            alt={ambassador.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 768px) 220px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#173b2a]/80 via-transparent to-transparent" />
          <Badge className="absolute left-3 top-3 rounded-full bg-[#e6aa38] text-[11px] font-black text-[#173b2a]">
            <Crown className="mr-1 size-3" />
            Ambassador
          </Badge>
          {ambassador.isExclusive && (
            <Badge className="absolute bottom-3 left-3 rounded-full bg-white/90 text-[11px] font-black text-[#185c39]">
              Exclusive partner
            </Badge>
          )}
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-12 border border-[#d9e0d8]">
                <AvatarImage src={ambassador.avatar} alt={ambassador.name} />
                <AvatarFallback className="bg-[#185c39] font-black text-white">{ambassador.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="line-clamp-1 text-xl font-black tracking-[-0.04em] text-[#173b2a]">{ambassador.name}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#718077]">
                  <MapPin className="size-3.5 text-[#b77a12]" />
                  {ambassador.city}
                </p>
              </div>
            </div>
            <div className="rounded-full bg-[#fff1cd] px-3 py-1.5 text-sm font-black text-[#8b5e12]">
              {ambassador.rating} rating
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#647168]">{ambassador.bio}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {ambassador.categories.slice(0, 4).map((category) => (
              <span key={category} className="rounded-full bg-[#f4f2e9] px-2.5 py-1 text-[11px] font-black text-[#607168]">
                {category}
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-2 text-sm font-bold text-[#607168] sm:grid-cols-3">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
              <Users className="size-4 text-[#185c39]" />
              {formatFollowers(ambassador.totalFollowers)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
              <TrendingUp className="size-4 text-[#185c39]" />
              {ambassador.avgEngagementRate}% engagement
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
              <CalendarClock className="size-4 text-[#185c39]" />
              {ambassador.responseTime}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-[#edf0eb] bg-[#fbfaf5] p-4 md:border-l md:border-t-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b77a12]">Managed from</p>
            <p className="mt-1 text-2xl font-black tracking-[-0.05em] text-[#173b2a]">
              {formatPrice(ambassador.monthlyBase || ambassador.minPrice || 50000)}
            </p>
            <p className="mt-1 text-xs font-bold text-[#718077]">Platform support included</p>
          </div>
          <div className="grid gap-2">
            <Button asChild className="rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]">
              <Link href={`/creator/${ambassador.username}`}>
                View profile <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-[#d9e0d8] bg-white font-black text-[#185c39] hover:bg-[#e7f0ea]">
              <Link href="/brand/campaigns/new">Start campaign</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ExplorePageContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, setFilters } = useFilterStore();
  const { loadSavedCreators } = useAuthStore();

  const rawView = searchParams.get('view');
  const creatorView: 'all' | 'ambassadors' | 'saved' =
    rawView === 'saved' ? 'saved' : rawView === 'ambassadors' ? 'ambassadors' : 'all';

  const [creators, setCreators] = useState<Creator[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [hasCreatorsError, setHasCreatorsError] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [savedCreatorsList, setSavedCreatorsList] = useState<Creator[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [ambassadors, setAmbassadors] = useState<PlatformAmbassador[]>([]);
  const [isLoadingAmbassadors, setIsLoadingAmbassadors] = useState(false);

  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isQuickDealOpen, setIsQuickDealOpen] = useState(false);
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [savedSortBy, setSavedSortBy] = useState('recent');
  const [savedViewMode, setSavedViewMode] = useState<'grid' | 'list'>('grid');

  const setCreatorView = (nextView: 'all' | 'ambassadors' | 'saved') => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === 'saved') {
      params.set('view', 'saved');
    } else if (nextView === 'ambassadors') {
      params.set('view', 'ambassadors');
    } else {
      params.delete('view');
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  useEffect(() => {
    const category = searchParams.get('category');
    const filter = searchParams.get('filter');

    const dealTypeFromFilter = filter === 'barter' || filter === 'hybrid' || filter === 'paid'
      ? [filter as DealType]
      : undefined;

    if (category || dealTypeFromFilter || filter === 'rising') {
      setFilters({
        categories: category ? [category.charAt(0).toUpperCase() + category.slice(1)] : filters.categories,
        dealTypes: dealTypeFromFilter || filters.dealTypes,
        sortBy: filter === 'rising' ? 'trending' : filters.sortBy,
      });
    }
    // Run once when params become available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const fetchCreators = async () => {
      setIsLoadingCreators(true);
      setHasCreatorsError(false);
      try {
        const { creators: data, total } = await creatorsService.getAll(filters);
        setCreators(data);
        setTotalCount(total);
      } catch (error) {
        console.error('Failed to fetch creators:', error);
        setHasCreatorsError(true);
      } finally {
        setIsLoadingCreators(false);
      }
    };

    void fetchCreators();
  }, [filters]);

  useEffect(() => {
    const fetchSavedCreators = async () => {
      setIsLoadingSaved(true);
      const response = await savedCreatorsService.getAll().catch(() => ({ creators: [], total: 0 }));
      setSavedCreatorsList(response.creators);
      await loadSavedCreators();
      setIsLoadingSaved(false);
    };

    void fetchSavedCreators();
  }, [loadSavedCreators]);

  useEffect(() => {
    const fetchAmbassadors = async () => {
      setIsLoadingAmbassadors(true);
      const data = await ambassadorService.listAmbassadors(24).catch(() => []);
      setAmbassadors(data);
      setIsLoadingAmbassadors(false);
    };
    void fetchAmbassadors();
  }, []);

  const [featuredPackages, setFeaturedPackages] = useState<Package[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoadingFeatured(true);
      const result = await packagesService.getFeatured(0, 8).catch(() => ({ items: [] }));
      setFeaturedPackages(result.items);
      setIsLoadingFeatured(false);
    };
    void fetchFeatured();
  }, []);

  const handleQuickDeal = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsQuickDealOpen(true);
  };

  const handleSearchChange = useCallback((value: string) => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setFilters({ search: value });
    }, 350);
  }, [setFilters]);

  const activeFilterCount = [
    filters.categories?.length || 0,
    filters.platforms?.length || 0,
    filters.cities?.length || 0,
    filters.dealTypes?.length || 0,
    filters.barterTypes?.length || 0,
    filters.minFollowers ? 1 : 0,
    filters.minRating ? 1 : 0,
    filters.minPrice || filters.maxPrice ? 1 : 0,
    filters.badgeLevel ? 1 : 0,
    filters.availabilityStatus ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const filteredSavedCreators = useMemo(
    () =>
      savedCreatorsList.filter(
        (creator) =>
          creator.name.toLowerCase().includes(savedSearchQuery.toLowerCase()) ||
          creator.categories.some((cat) => cat.toLowerCase().includes(savedSearchQuery.toLowerCase())),
      ),
    [savedCreatorsList, savedSearchQuery],
  );

  const sortedSavedCreators = useMemo(() => {
    const next = [...filteredSavedCreators];
    next.sort((a, b) => {
      switch (savedSortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'followers':
          return (
            b.platforms.reduce((sum, p) => sum + p.followers, 0) -
            a.platforms.reduce((sum, p) => sum + p.followers, 0)
          );
        case 'price_low':
          return (a.minPrice ?? 0) - (b.minPrice ?? 0);
        case 'price_high':
          return (b.minPrice ?? 0) - (a.minPrice ?? 0);
        default:
          return 0;
      }
    });
    return next;
  }, [filteredSavedCreators, savedSortBy]);

  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#d9e0d8] bg-[#173b2a] text-white shadow-[0_24px_80px_rgba(23,59,42,0.14)]">
          <div className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
                  <Sparkles className="size-3.5" />
                  Creator discovery desk
                </div>
              </div>

              <div className="inline-flex w-full rounded-full border border-white/12 bg-white/8 p-1 lg:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('flex-1 rounded-full font-black text-[#d4e0d8] hover:bg-white/10 hover:text-white lg:flex-none', creatorView === 'all' && 'bg-[#e6aa38] text-[#173b2a] hover:bg-[#e6aa38] hover:text-[#173b2a]')}
                  onClick={() => setCreatorView('all')}
                >
                  All Creators
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('flex-1 rounded-full font-black text-[#d4e0d8] hover:bg-white/10 hover:text-white lg:flex-none', creatorView === 'ambassadors' && 'bg-[#e6aa38] text-[#173b2a] hover:bg-[#e6aa38] hover:text-[#173b2a]')}
                  onClick={() => setCreatorView('ambassadors')}
                >
                  <Crown className="mr-1.5 size-3.5" />
                  Platform Ambassadors
                  <Badge className="ml-2 h-5 rounded-full bg-white/16 px-1.5 text-[10px] text-current">
                    {ambassadors.length}
                  </Badge>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('flex-1 rounded-full font-black text-[#d4e0d8] hover:bg-white/10 hover:text-white lg:flex-none', creatorView === 'saved' && 'bg-[#e6aa38] text-[#173b2a] hover:bg-[#e6aa38] hover:text-[#173b2a]')}
                  onClick={() => setCreatorView('saved')}
                >
                  Saved Creators
                  <Badge className="ml-2 h-5 rounded-full bg-white/16 px-1.5 text-[10px] text-current">
                    {savedCreatorsList.length}
                  </Badge>
                </Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              <HeroStat label="Creators" value={isLoadingCreators ? '...' : String(totalCount)} icon={Users} />
              <HeroStat label="Ambassadors" value={isLoadingAmbassadors ? '...' : String(ambassadors.length)} icon={Crown} />
              <HeroStat label="Saved" value={String(savedCreatorsList.length)} icon={Heart} />
            </div>
          </div>
        </section>

        {creatorView === 'all' ? (
          <>
            <motion.section
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-[1.5rem] border border-[#d9e0d8] bg-white p-3 shadow-[0_16px_54px_rgba(38,70,50,0.06)] sm:p-4"
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b77a12]">Search creators</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b867f]" />
                    <Input
                      type="search"
                      placeholder="Search food vloggers in Karachi, cafes, TikTok, reels..."
                      className="h-12 rounded-full border-[#d9e0d8] bg-[#f4f2e9] pl-12 text-base font-bold text-[#173b2a] placeholder:text-[#7c8a82] focus-visible:ring-[#185c39]/20"
                      defaultValue={filters.search || ''}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="lg:hidden">
                    <FilterPanel isMobile />
                  </div>
                  <Select
                    value={filters.sortBy || 'trending'}
                    onValueChange={(value) => setFilters({ sortBy: value as typeof filters.sortBy })}
                  >
                    <SelectTrigger className="h-11 flex-1 rounded-full border-[#d9e0d8] bg-[#fbfaf5] font-black text-[#185c39] sm:w-[190px] sm:flex-none">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 flex flex-wrap items-center gap-2"
                >
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#7b867f]">Active</span>
                  {filters.categories?.map((cat) => (
                    <Badge key={cat} className="cursor-pointer rounded-full bg-[#e7f0ea] text-[#185c39]" onClick={() => setFilters({ categories: filters.categories?.filter((c) => c !== cat) })}>
                      {cat} x
                    </Badge>
                  ))}
                  {filters.cities?.map((city) => (
                    <Badge key={city} className="cursor-pointer rounded-full bg-[#e7f0ea] text-[#185c39]" onClick={() => setFilters({ cities: filters.cities?.filter((c) => c !== city) })}>
                      {city} x
                    </Badge>
                  ))}
                  {filters.dealTypes?.map((type) => (
                    <Badge key={type} className="cursor-pointer rounded-full bg-[#fff1cd] text-[#8b5e12]" onClick={() => setFilters({ dealTypes: filters.dealTypes?.filter((t) => t !== type) })}>
                      {type} x
                    </Badge>
                  ))}
                  {filters.badgeLevel && (
                    <Badge className="cursor-pointer rounded-full bg-[#e7f0ea] text-[#185c39] capitalize" onClick={() => setFilters({ badgeLevel: undefined })}>
                      {filters.badgeLevel.replace('_', ' ')} x
                    </Badge>
                  )}
                  {filters.availabilityStatus && (
                    <Badge className="cursor-pointer rounded-full bg-[#e7f0ea] text-[#185c39] capitalize" onClick={() => setFilters({ availabilityStatus: undefined })}>
                      {filters.availabilityStatus} x
                    </Badge>
                  )}
                  {(filters.minPrice || filters.maxPrice) && (
                    <Badge className="cursor-pointer rounded-full bg-[#fff1cd] text-[#8b5e12]" onClick={() => setFilters({ minPrice: undefined, maxPrice: undefined })}>
                      {filters.minPrice ? formatPrice(filters.minPrice) : 'Any'} - {filters.maxPrice ? formatPrice(filters.maxPrice) : 'Any'} x
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full text-xs font-black text-[#185c39] hover:bg-[#e7f0ea]"
                    onClick={() =>
                      setFilters({
                        categories: [],
                        cities: [],
                        dealTypes: [],
                        platforms: [],
                        barterTypes: [],
                        minFollowers: undefined,
                        maxFollowers: undefined,
                        minRating: undefined,
                        minPrice: undefined,
                        maxPrice: undefined,
                        badgeLevel: undefined,
                        availabilityStatus: undefined,
                      })
                    }
                  >
                    Clear all
                  </Button>
                </motion.div>
              )}
            </motion.section>

            {(isLoadingFeatured || featuredPackages.length > 0) && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#b77a12]">
                    <Sparkles className="size-4" />
                    Featured Packages
                  </p>
                  <Link
                    href="/brand/explore/packages"
                    className="flex items-center gap-1 text-xs font-black text-[#185c39] hover:underline"
                  >
                    View all <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {isLoadingFeatured
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-[148px] w-[220px] shrink-0 animate-pulse rounded-[1.25rem] bg-[#e6eceb]"
                        />
                      ))
                    : featuredPackages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="group flex w-[220px] shrink-0 flex-col justify-between rounded-[1.25rem] border border-[#d9e0d8] bg-white p-4 shadow-[0_4px_16px_rgba(38,70,50,0.06)] transition-shadow hover:shadow-[0_8px_28px_rgba(38,70,50,0.12)]"
                        >
                          <div className="min-w-0">
                            <p className="mb-1 line-clamp-2 text-sm font-black leading-snug text-[#173b2a]">{pkg.title}</p>
                            <p className="line-clamp-1 text-[11px] text-[#496159]">{pkg.platform}</p>
                          </div>
                          <div className="mt-3 flex items-end justify-between gap-2">
                            <div>
                              <span className={cn(
                                'inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
                                pkg.dealType === 'paid' && 'bg-[#e7f0ea] text-[#185c39]',
                                pkg.dealType === 'barter' && 'bg-[#fff1cd] text-[#8b5e12]',
                                pkg.dealType === 'hybrid' && 'bg-[#e8e4ff] text-[#4a3a9e]',
                              )}>
                                {pkg.dealType}
                              </span>
                            </div>
                            {pkg.price > 0 && (
                              <p className="shrink-0 text-sm font-black text-[#173b2a]">{formatPrice(pkg.price)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                </div>
              </motion.section>
            )}

            <section className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-24 overflow-hidden rounded-[1.5rem] border border-[#d9e0d8] bg-white shadow-[0_16px_54px_rgba(38,70,50,0.06)]">
                  <div className="border-b border-[#edf0eb] bg-[#fbfaf5] px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-black text-[#173b2a]">
                      <SlidersHorizontal className="size-4 text-[#b77a12]" />
                      Refine shortlist
                    </p>
                  </div>
                  <FilterPanel />
                </div>
              </aside>

              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black text-[#173b2a]">
                    {isLoadingCreators ? 'Loading creators...' : `${totalCount} creators found`}
                  </p>
                  <p className="hidden text-xs font-bold text-[#718077] sm:block">Compact cards. Better scanning. Less wandering.</p>
                </div>

                {isLoadingCreators ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <CreatorCardSkeleton key={i} />
                    ))}
                  </div>
                ) : hasCreatorsError ? (
                  <ErrorState title="Unable to load creators" description="Please check your connection and try again." onRetry={() => setFilters({ ...filters })} />
                ) : creators.length === 0 ? (
                  <EmptyState
                    title="No creators found"
                    description="Try adjusting your filters or search query to find more creators."
                    action={{
                      label: 'Clear filters',
                      onClick: () =>
                        setFilters({
                          search: '',
                          categories: [],
                          cities: [],
                          dealTypes: [],
                          platforms: [],
                          barterTypes: [],
                          minFollowers: undefined,
                          maxFollowers: undefined,
                          minRating: undefined,
                          minPrice: undefined,
                          maxPrice: undefined,
                          badgeLevel: undefined,
                          availabilityStatus: undefined,
                        }),
                    }}
                  />
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {creators.map((creator, index) => (
                      <motion.div key={creator.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                        <CreatorCard creator={creator} className="border-[#d9e0d8] shadow-[0_12px_38px_rgba(38,70,50,0.055)]" onQuickDeal={() => handleQuickDeal(creator)} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </section>
          </>
        ) : creatorView === 'ambassadors' ? (
          <motion.section
            key="ambassadors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b77a12]">Curated roster</p>
                <h2 className="mt-1 flex items-center gap-2 text-2xl font-black tracking-[-0.05em] text-[#173b2a]">
                  <Crown className="size-6 text-[#b77a12]" />
                  Platform Ambassadors
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#647168]">
                  Pre-vetted creators managed by ZingZing. Ideal for high-trust launches, tasting nights, and premium food campaigns.
                </p>
              </div>
              {!isLoadingAmbassadors && ambassadors.length > 0 && (
                <Button asChild className="rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]">
                  <Link href="/brand/campaigns/new">
                    Start campaign <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              )}
            </div>

            {isLoadingAmbassadors ? (
              <div className="rounded-[1.5rem] border border-[#d9e0d8] bg-white p-8 text-center">
                <p className="text-sm font-bold text-[#647168]">Loading ambassadors...</p>
              </div>
            ) : ambassadors.length === 0 ? (
              <div className="rounded-[1.45rem] border border-dashed border-[#cdd7ce] bg-white p-6 text-center shadow-[0_14px_45px_rgba(38,70,50,0.055)]">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f4f2e9] text-[#b77a12]">
                  <Crown className="size-5" />
                </div>
                <h2 className="mt-4 text-xl font-black tracking-[-0.04em] text-[#173b2a]">Ambassadors are being curated.</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647168]">
                  You can still browse food creators and start a campaign while the ambassador roster grows.
                </p>
                <Button
                  className="mt-5 rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b]"
                  onClick={() => setCreatorView('all')}
                >
                  Browse all creators
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {ambassadors.map((ambassador) => (
                  <AmbassadorRow key={ambassador.id} ambassador={ambassador} />
                ))}
              </div>
            )}
          </motion.section>
        ) : (
          <section className="mt-4">
            <div className="rounded-[1.5rem] border border-[#d9e0d8] bg-white p-3 shadow-[0_16px_54px_rgba(38,70,50,0.06)] sm:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-md">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b867f]" />
                  <Input
                    type="text"
                    placeholder="Search saved creators..."
                    className="h-11 rounded-full border-[#d9e0d8] bg-[#f4f2e9] pl-10 font-bold text-[#173b2a] placeholder:text-[#7c8a82] focus-visible:ring-[#185c39]/20"
                    value={savedSearchQuery}
                    onChange={(e) => setSavedSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={savedSortBy} onValueChange={setSavedSortBy}>
                    <SelectTrigger className="h-11 flex-1 rounded-full border-[#d9e0d8] bg-[#fbfaf5] font-black text-[#185c39] md:w-48 md:flex-none">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently Saved</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="followers">Most Followers</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="hidden rounded-full bg-[#f4f2e9] p-1 md:flex">
                    <Button variant="ghost" size="icon" className={cn('rounded-full text-[#607168]', savedViewMode === 'grid' && 'bg-white text-[#185c39] shadow-sm')} onClick={() => setSavedViewMode('grid')}>
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className={cn('rounded-full text-[#607168]', savedViewMode === 'list' && 'bg-white text-[#185c39] shadow-sm')} onClick={() => setSavedViewMode('list')}>
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {isLoadingSaved ? (
                <Card className="rounded-[1.5rem] border-[#d9e0d8] bg-white">
                  <CardContent className="flex items-center justify-center py-10 text-sm font-bold text-[#647168]">Loading saved creators...</CardContent>
                </Card>
              ) : savedCreatorsList.length === 0 ? (
                <EmptyState icon={Heart} title="No saved creators yet" description="Save creators you're interested in to easily find them later." action={{ label: 'Discover creators', onClick: () => setCreatorView('all') }} />
              ) : sortedSavedCreators.length > 0 ? (
                <div className={savedViewMode === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-3'}>
                  {sortedSavedCreators.map((creator, index) => (
                    <motion.div key={creator.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                      <CreatorCard creator={creator} className="border-[#d9e0d8] shadow-[0_12px_38px_rgba(38,70,50,0.055)]" variant={savedViewMode === 'list' ? 'horizontal' : 'default'} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="rounded-[1.5rem] border-[#d9e0d8] bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Search className="mb-4 h-10 w-10 text-[#b77a12]" />
                    <h3 className="mb-2 text-lg font-black text-[#173b2a]">No results found</h3>
                    <p className="text-center text-sm font-bold text-[#647168]">No saved creators match your search.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

      {selectedCreator && (
        <QuickDealModal
          creator={selectedCreator}
          isOpen={isQuickDealOpen}
          onClose={() => {
            setIsQuickDealOpen(false);
            setSelectedCreator(null);
          }}
        />
      )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8" />}>
      <ExplorePageContent />
    </Suspense>
  );
}
