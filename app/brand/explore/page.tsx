'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, TrendingUp, Star, Wallet, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { creatorsService } from '@/services/creators.service';
import type { Creator, DealType } from '@/types';
import { cn } from '@/lib/utils';

const sortOptions = [
  { value: 'trending', label: 'Trending', icon: TrendingUp },
  { value: 'budget_friendly', label: 'Budget Friendly', icon: Wallet },
  { value: 'top_rated', label: 'Top Rated', icon: Star },
  { value: 'near_you', label: 'Near You', icon: MapPin },
];

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const { filters, setFilters } = useFilterStore();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isQuickDealOpen, setIsQuickDealOpen] = useState(false);

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

  // Fetch creators
  useEffect(() => {
    const fetchCreators = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const data = await creatorsService.getAll(filters);
        setCreators(data);
      } catch (error) {
        console.error('Failed to fetch creators:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreators();
  }, [filters]);

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
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {/* Search & Sort Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 space-y-4"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 lg:max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search food vloggers in Riyadh or TikTok tech creators"
              className="h-12 rounded-full bg-muted pl-12 text-base"
              value={filters.search || ''}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
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
                })
              }
            >
              Clear all
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Main Content */}
      <div className="flex gap-6 lg:gap-8">
        {/* Desktop Filter Panel */}
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        {/* Creator Grid */}
        <div className="flex-1">
          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${creators.length} creators found`}
            </p>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CreatorCardSkeleton key={i} />
              ))}
            </div>
          ) : hasError ? (
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

      {/* Quick Deal Modal */}
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

