'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useFilterStore } from '@/store/filter-store';
import { categories, cities, platforms, dealTypes, barterTypes, followerRanges, priceRanges } from '@/data/creators';
import type { Platform, City, DealType, BarterType } from '@/types';
import { cn, formatFollowers } from '@/lib/utils';

interface FilterPanelProps {
  className?: string;
  isMobile?: boolean;
}

export function FilterPanel({ className, isMobile = false }: FilterPanelProps) {
  const { filters, setFilters, resetFilters, isFilterPanelOpen, setFilterPanelOpen } = useFilterStore();

  const activeFilterCount = [
    filters.categories?.length || 0,
    filters.platforms?.length || 0,
    filters.cities?.length || 0,
    filters.dealTypes?.length || 0,
    filters.barterTypes?.length || 0,
    filters.minFollowers ? 1 : 0,
    filters.minRating ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const toggleArrayFilter = <T extends string>(
    key: 'categories' | 'platforms' | 'cities' | 'dealTypes' | 'barterTypes',
    value: T
  ) => {
    const current = (filters[key] as T[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ [key]: updated });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Categories</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={filters.categories?.includes(category) ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => toggleArrayFilter('categories', category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Platform</h4>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <Badge
              key={platform}
              variant={filters.platforms?.includes(platform) ? 'default' : 'outline'}
              className="cursor-pointer capitalize transition-colors"
              onClick={() => toggleArrayFilter('platforms', platform as Platform)}
            >
              {platform}
            </Badge>
          ))}
        </div>
      </div>

      {/* Cities */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">City</h4>
        <div className="space-y-2">
          {cities.map((city) => (
            <div key={city} className="flex items-center space-x-2">
              <Checkbox
                id={`city-${city}`}
                checked={filters.cities?.includes(city)}
                onCheckedChange={() => toggleArrayFilter('cities', city as City)}
              />
              <Label htmlFor={`city-${city}`} className="cursor-pointer text-sm">
                {city}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Deal Types */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Pricing Type</h4>
        <div className="flex flex-wrap gap-2">
          {dealTypes.map((type) => (
            <Badge
              key={type.value}
              variant={filters.dealTypes?.includes(type.value) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                type.value === 'barter' && filters.dealTypes?.includes(type.value) && 'bg-accent text-accent-foreground'
              )}
              onClick={() => toggleArrayFilter('dealTypes', type.value as DealType)}
            >
              {type.value === 'barter' && '🎁 '}
              {type.value === 'hybrid' && '💰🎁 '}
              {type.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Barter Types */}
      {(filters.dealTypes?.includes('barter') || filters.dealTypes?.includes('hybrid')) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h4 className="mb-3 text-sm font-semibold">Barter Type</h4>
          <div className="flex flex-wrap gap-2">
            {barterTypes.map((type) => (
              <Badge
                key={type.value}
                variant={filters.barterTypes?.includes(type.value) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => toggleArrayFilter('barterTypes', type.value as BarterType)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Followers Range */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Followers</h4>
        <div className="space-y-2">
          {followerRanges.map((range) => (
            <div key={range.label} className="flex items-center space-x-2">
              <Checkbox
                id={`followers-${range.label}`}
                checked={filters.minFollowers === range.min && filters.maxFollowers === range.max}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFilters({ minFollowers: range.min, maxFollowers: range.max });
                  } else {
                    setFilters({ minFollowers: undefined, maxFollowers: undefined });
                  }
                }}
              />
              <Label htmlFor={`followers-${range.label}`} className="cursor-pointer text-sm">
                {range.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Minimum Rating</h4>
        <div className="px-2">
          <Slider
            value={[filters.minRating || 0]}
            onValueChange={([value]) => setFilters({ minRating: value || undefined })}
            max={5}
            min={0}
            step={0.5}
            className="w-full"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Any</span>
            <span>{filters.minRating || 0}+ stars</span>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Budget</h4>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <div key={range.label} className="flex items-center space-x-2">
              <Checkbox
                id={`price-${range.label}`}
                checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFilters({ minPrice: range.min, maxPrice: range.max });
                  } else {
                    setFilters({ minPrice: undefined, maxPrice: undefined });
                  }
                }}
              />
              <Label htmlFor={`price-${range.label}`} className="cursor-pointer text-sm">
                {range.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <Button variant="outline" className="w-full" onClick={resetFilters}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset Filters
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isFilterPanelOpen} onOpenChange={setFilterPanelOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full max-w-sm p-0">
          <SheetHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <SheetTitle>Filters</SheetTitle>
              {activeFilterCount > 0 && (
                <Badge>{activeFilterCount} active</Badge>
              )}
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)] p-4">
            <FilterContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {activeFilterCount > 0 && (
          <Badge variant="secondary">{activeFilterCount} active</Badge>
        )}
      </div>
      <ScrollArea className="h-[calc(100vh-200px)] pr-4">
        <FilterContent />
      </ScrollArea>
    </div>
  );
}
