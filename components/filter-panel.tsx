'use client';

import { motion } from 'framer-motion';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFilterStore } from '@/store/filter-store';
import { categories, cities, platforms, dealTypes, barterTypes, followerRanges, priceRanges } from '@/data/creators';
import type { Platform, City, DealType, BarterType } from '@/types';
import { cn } from '@/lib/utils';

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

  const Section = ({ title, value, children }: { title: string; value: string; children: React.ReactNode }) => {
    if (!isMobile) {
      return (
        <div>
          <h4 className="mb-3 text-sm font-semibold">{title}</h4>
          {children}
        </div>
      );
    }

    return (
      <AccordionItem value={value}>
        <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">{title}</AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    );
  };

  const filterSections = (
    <>
      <Section title="Categories" value="categories">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category} variant={filters.categories?.includes(category) ? 'default' : 'outline'} className="cursor-pointer transition-colors" onClick={() => toggleArrayFilter('categories', category)}>
              {category}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Platform" value="platforms">
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <Badge key={platform} variant={filters.platforms?.includes(platform) ? 'default' : 'outline'} className="cursor-pointer capitalize transition-colors" onClick={() => toggleArrayFilter('platforms', platform as Platform)}>
              {platform}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="City" value="cities">
        <div className="space-y-2">
          {cities.map((city) => (
            <div key={city} className="flex items-center space-x-2">
              <Checkbox id={`city-${city}`} checked={filters.cities?.includes(city)} onCheckedChange={() => toggleArrayFilter('cities', city as City)} />
              <Label htmlFor={`city-${city}`} className="cursor-pointer text-sm">{city}</Label>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pricing Type" value="dealTypes">
        <div className="flex flex-wrap gap-2">
          {dealTypes.map((type) => (
            <Badge key={type.value} variant={filters.dealTypes?.includes(type.value) ? 'default' : 'outline'} className={cn('cursor-pointer transition-colors', type.value === 'barter' && filters.dealTypes?.includes(type.value) && 'bg-accent text-accent-foreground')} onClick={() => toggleArrayFilter('dealTypes', type.value as DealType)}>
              {type.value === 'barter' && '🎁 '}
              {type.value === 'hybrid' && '💰🎁 '}
              {type.label}
            </Badge>
          ))}
        </div>
      </Section>

      {(filters.dealTypes?.includes('barter') || filters.dealTypes?.includes('hybrid')) && (
        <Section title="Barter Type" value="barterTypes">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
            {barterTypes.map((type) => (
              <Badge key={type.value} variant={filters.barterTypes?.includes(type.value) ? 'default' : 'outline'} className="cursor-pointer transition-colors" onClick={() => toggleArrayFilter('barterTypes', type.value as BarterType)}>
                {type.label}
              </Badge>
            ))}
          </motion.div>
        </Section>
      )}

      <Section title="Followers" value="followers">
        <div className="space-y-2">
          {followerRanges.map((range) => (
            <div key={range.label} className="flex items-center space-x-2">
              <Checkbox id={`followers-${range.label}`} checked={filters.minFollowers === range.min && filters.maxFollowers === range.max} onCheckedChange={(checked) => checked ? setFilters({ minFollowers: range.min, maxFollowers: range.max }) : setFilters({ minFollowers: undefined, maxFollowers: undefined })} />
              <Label htmlFor={`followers-${range.label}`} className="cursor-pointer text-sm">{range.label}</Label>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Minimum Rating" value="rating">
        <div className="px-2">
          <Slider value={[filters.minRating || 0]} onValueChange={([value]) => setFilters({ minRating: value || undefined })} max={5} min={0} step={0.5} className="w-full" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Any</span>
            <span>{filters.minRating || 0}+ stars</span>
          </div>
        </div>
      </Section>

      <Section title="Budget" value="budget">
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <div key={range.label} className="flex items-center space-x-2">
              <Checkbox id={`price-${range.label}`} checked={filters.minPrice === range.min && filters.maxPrice === range.max} onCheckedChange={(checked) => checked ? setFilters({ minPrice: range.min, maxPrice: range.max }) : setFilters({ minPrice: undefined, maxPrice: undefined })} />
              <Label htmlFor={`price-${range.label}`} className="cursor-pointer text-sm">{range.label}</Label>
            </div>
          ))}
        </div>
      </Section>
    </>
  );

  const FilterContent = () => (
    <div className="space-y-4">
      {isMobile ? (
        <Accordion type="multiple" defaultValue={['categories', 'dealTypes', 'budget']} className="w-full">
          {filterSections}
        </Accordion>
      ) : (
        <div className="space-y-6">{filterSections}</div>
      )}
      {!isMobile && (
        <Button variant="outline" className="w-full" onClick={resetFilters}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isFilterPanelOpen} onOpenChange={setFilterPanelOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="min-h-11 gap-2 rounded-full">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90dvh] rounded-t-2xl border-t p-0">
          <SheetHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <SheetTitle>Filters</SheetTitle>
              {activeFilterCount > 0 && (
                <Badge>{activeFilterCount} active</Badge>
              )}
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(90dvh-9.5rem)] p-4">
            <FilterContent />
          </ScrollArea>
          <div className="border-t bg-background p-4 pb-safe">
            <div className="flex gap-2">
              <Button variant="outline" className="min-h-11 flex-1" onClick={resetFilters}>
                Clear
              </Button>
              <Button className="min-h-11 flex-1" onClick={() => setFilterPanelOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
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
