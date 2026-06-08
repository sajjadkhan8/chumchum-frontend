'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Star, Wallet, MapPin, Crown, Heart, Grid, List } from 'lucide-react';
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
import type { Creator, DealType } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import Link from 'next/link';

const sortOptions = [
  { value: 'trending', label: 'Trending', icon: TrendingUp },
  { value: 'budget_friendly', label: 'Budget Friendly', icon: Wallet },
  { value: 'top_rated', label: 'Top Rated', icon: Star },
  { value: 'near_you', label: 'Near You', icon: MapPin },
];

function ExplorePageContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, setFilters } = useFilterStore();
  const { loadSavedCreators } = useAuthStore();

  const creatorView = searchParams.get('view') === 'saved' ? 'saved' : 'all';

  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [hasCreatorsError, setHasCreatorsError] = useState(false);
  const [savedCreatorsList, setSavedCreatorsList] = useState<Creator[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isQuickDealOpen, setIsQuickDealOpen] = useState(false);
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [savedSortBy, setSavedSortBy] = useState('recent');
  const [savedViewMode, setSavedViewMode] = useState<'grid' | 'list'>('grid');

  const setCreatorView = (nextView: 'all' | 'saved') => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === 'saved') {
      params.set('view', 'saved');
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
        const data = await creatorsService.getAll(filters);
        setCreators(data);
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

  const handleQuickDeal = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsQuickDealOpen(true);
  };

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
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Creators</h1>
          <p className="text-sm text-muted-foreground">Discover new creators and manage your saved shortlist in one place.</p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-muted p-1">
          <Button
            variant={creatorView === 'all' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => setCreatorView('all')}
          >
            All Creators
          </Button>
          <Button
            variant={creatorView === 'saved' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => setCreatorView('saved')}
          >
            Saved Creators
            <Badge className="ml-2 h-5 rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">
              {savedCreatorsList.length}
            </Badge>
          </Button>
        </div>
      </div>

      {creatorView === 'all' ? (
        <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 space-y-4"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Bar */}
          <div className="flex-1 lg:max-w-xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Search creators by niche, city, or platform</p>
              <Link href="/brand/ambassadors" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Ambassador search
                <Badge className="h-4 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">New</Badge>
              </Link>
            </div>
            <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search food vloggers in Karachi or TikTok tech creators"
              className="h-12 rounded-full bg-muted pl-12 text-base"
              value={filters.search || ''}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
            </div>
          </div>

          {/* Sort & Filter Controls */}
          <div className="flex w-full items-center gap-2 sm:gap-3 lg:w-auto">
            {/* Mobile Filter Button */}
            <div className="lg:hidden">
              <FilterPanel isMobile />
            </div>

            {/* Sort Dropdown */}
            <Select
              value={filters.sortBy || 'trending'}
              onValueChange={(value) => setFilters({ sortBy: value as typeof filters.sortBy })}
            >
              <SelectTrigger className="h-11 w-full rounded-full sm:w-[180px]">
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

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.categories?.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="cursor-pointer"
                onClick={() =>
                  setFilters({
                    categories: filters.categories?.filter((c) => c !== cat),
                  })
                }
              >
                {cat} &times;
              </Badge>
            ))}
            {filters.cities?.map((city) => (
              <Badge
                key={city}
                variant="secondary"
                className="cursor-pointer"
                onClick={() =>
                  setFilters({
                    cities: filters.cities?.filter((c) => c !== city),
                  })
                }
              >
                {city} &times;
              </Badge>
            ))}
            {filters.dealTypes?.map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className={cn('cursor-pointer', type === 'barter' && 'bg-accent text-accent-foreground')}
                onClick={() =>
                  setFilters({
                    dealTypes: filters.dealTypes?.filter((t) => t !== type),
                  })
                }
              >
                {type === 'barter' && '🎁 '}
                {type} &times;
              </Badge>
            ))}
            {filters.badgeLevel && (
              <Badge variant="secondary" className="cursor-pointer capitalize" onClick={() => setFilters({ badgeLevel: undefined })}>
                {filters.badgeLevel.replace('_', ' ')} &times;
              </Badge>
            )}
            {filters.availabilityStatus && (
              <Badge variant="secondary" className="cursor-pointer capitalize" onClick={() => setFilters({ availabilityStatus: undefined })}>
                {filters.availabilityStatus} &times;
              </Badge>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilters({ minPrice: undefined, maxPrice: undefined })}>
                {filters.minPrice ? formatPrice(filters.minPrice) : 'Any'} - {filters.maxPrice ? formatPrice(filters.maxPrice) : 'Any'} &times;
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
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
      </motion.div>

      <div className="flex gap-6 lg:gap-8">
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-primary" />
                  <div>
                      <p className="font-semibold text-foreground inline-flex items-center gap-2">
                        Looking for verified premium creators?
                        <Badge className="h-4 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">New</Badge>
                      </p>
                    <p className="text-sm text-muted-foreground">Check out our curated Platform Ambassadors with guaranteed quality.</p>
                  </div>
                </div>
                <Link href="/brand/ambassadors">
                  <Button size="sm" variant="outline" className="rounded-full">
                    View Ambassadors
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoadingCreators ? 'Loading...' : `${creators.length} creators found`}
            </p>
          </div>

          {isLoadingCreators ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CreatorCardSkeleton key={i} />
              ))}
            </div>
          ) : hasCreatorsError ? (
            <ErrorState
              title="Unable to load creators"
              description="Please check your connection and try again."
              onRetry={() => setFilters({ ...filters })}
            />
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {creators.map((creator, index) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CreatorCard
                    creator={creator}
                    onQuickDeal={() => handleQuickDeal(creator)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
        </>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search saved creators..."
                className="pl-9"
                value={savedSearchQuery}
                onChange={(e) => setSavedSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={savedSortBy} onValueChange={setSavedSortBy}>
                <SelectTrigger className="w-44">
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
              <div className="hidden md:flex">
                <Button
                  variant={savedViewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setSavedViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={savedViewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setSavedViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoadingSaved ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Loading saved creators...
              </CardContent>
            </Card>
          ) : savedCreatorsList.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No saved creators yet"
              description="Save creators you're interested in to easily find them later."
              action={{ label: 'Discover creators', onClick: () => setCreatorView('all') }}
            />
          ) : sortedSavedCreators.length > 0 ? (
            <div
              className={
                savedViewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'space-y-4'
              }
            >
              {sortedSavedCreators.map((creator, index) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CreatorCard
                    creator={creator}
                    variant={savedViewMode === 'list' ? 'horizontal' : 'default'}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No results found</h3>
                <p className="text-center text-muted-foreground">No saved creators match your search.</p>
              </CardContent>
            </Card>
          )}
        </>
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
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8" />}>
      <ExplorePageContent />
    </Suspense>
  );
}
