import { apiClient } from '@/lib/api/client';
import {
  barterTypeOptions,
  barterTypeValues,
  categoryOptions,
  categoryValues,
  getBarterTypeLabel,
  normalizeBarterTypes,
  normalizeCategories,
  type CategoryOption,
} from '@/lib/categories';
import { pakistanCities } from '@/lib/localization';
import type { BarterType, City, CollaborationPreference, Platform } from '@/types';

export interface RangeOption {
  min: number;
  max: number;
  label: string;
}

export interface LabeledValueOption<T extends string> {
  value: T;
  label: string;
}

export interface CreatorFilterMetadata {
  categories: string[];
  categoryOptions: CategoryOption[];
  cities: City[];
  platforms: Platform[];
  collaborationPreferences: LabeledValueOption<CollaborationPreference>[];
  barterTypes: LabeledValueOption<BarterType>[];
  followerRanges: RangeOption[];
  priceRanges: RangeOption[];
}

export const defaultCreatorFilterMetadata: CreatorFilterMetadata = {
  categories: categoryValues,
  categoryOptions,
  cities: [...pakistanCities],
  platforms: ['instagram', 'tiktok', 'youtube', 'facebook', 'snapchat'],
  collaborationPreferences: [
    { value: 'paid', label: 'Paid' },
    { value: 'barter', label: 'Barter' },
    { value: 'hybrid', label: 'Hybrid' },
  ],
  barterTypes: barterTypeOptions.map((option) => ({ value: option.value as BarterType, label: option.label })),
  followerRanges: [
    { min: 0, max: 10000, label: 'Nano (0-10K)' },
    { min: 10000, max: 50000, label: 'Micro (10K-50K)' },
    { min: 50000, max: 500000, label: 'Mid-tier (50K-500K)' },
    { min: 500000, max: 1000000, label: 'Macro (500K-1M)' },
    { min: 1000000, max: Number.MAX_SAFE_INTEGER, label: 'Mega (1M+)' },
  ],
  priceRanges: [
    { min: 0, max: 25000, label: 'Under PKR 25,000' },
    { min: 25000, max: 50000, label: 'PKR 25,000 - 50,000' },
    { min: 50000, max: 100000, label: 'PKR 50,000 - 100,000' },
    { min: 100000, max: 200000, label: 'PKR 100,000 - 200,000' },
    { min: 200000, max: Number.MAX_SAFE_INTEGER, label: 'PKR 200,000+' },
  ],
};

const normalizeMetadata = (payload: Partial<CreatorFilterMetadata> | null | undefined): CreatorFilterMetadata => {
  const categories = normalizeCategories(payload?.categories).length
    ? normalizeCategories(payload?.categories)
    : defaultCreatorFilterMetadata.categories;
  const options = payload?.categoryOptions?.length
    ? payload.categoryOptions
        .map((option) => ({ value: option.value, label: option.label }))
        .filter((option) => categories.includes(option.value))
    : categoryOptions.filter((option) => categories.includes(option.value));

  return {
    categories,
    categoryOptions: options.length ? options : defaultCreatorFilterMetadata.categoryOptions,
    cities: payload?.cities?.length ? payload.cities : defaultCreatorFilterMetadata.cities,
    platforms: payload?.platforms?.length ? payload.platforms : defaultCreatorFilterMetadata.platforms,
    collaborationPreferences: payload?.collaborationPreferences?.length ? payload.collaborationPreferences : defaultCreatorFilterMetadata.collaborationPreferences,
    barterTypes: payload?.barterTypes?.length
      ? payload.barterTypes
          .map((option) => {
            const value = normalizeBarterTypes([option.value])[0] as BarterType | undefined;
            return value ? { value, label: getBarterTypeLabel(value) } : null;
          })
          .filter((option): option is LabeledValueOption<BarterType> => Boolean(option))
          .filter((option) => barterTypeValues.includes(option.value))
      : defaultCreatorFilterMetadata.barterTypes,
    followerRanges: payload?.followerRanges?.length ? payload.followerRanges : defaultCreatorFilterMetadata.followerRanges,
    priceRanges: payload?.priceRanges?.length ? payload.priceRanges : defaultCreatorFilterMetadata.priceRanges,
  };
};

export interface SearchFilterMeta {
  categories: string[];
  categoryOptions?: CategoryOption[];
  languages: string[];
}

export const metadataService = {
  async getSearchFilters(): Promise<SearchFilterMeta> {
    try {
      const response = await apiClient.get<SearchFilterMeta>('/api/v1/metadata/search-filters', { auth: false });
      return response
        ? {
            ...response,
            categories: normalizeCategories(response.categories),
            categoryOptions: response.categoryOptions?.length ? response.categoryOptions : categoryOptions,
          }
        : { categories: [], languages: [] };
    } catch {
      return { categories: [], languages: [] };
    }
  },

  async getCreatorFilterMetadata(): Promise<CreatorFilterMetadata> {
    const endpoints = ['/api/v1/creators/metadata', '/api/v1/creators/filters', '/api/v1/metadata/creators'];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get<Partial<CreatorFilterMetadata> | { data?: Partial<CreatorFilterMetadata> }>(endpoint, {
          auth: false,
        });
        const payload = (response as { data?: Partial<CreatorFilterMetadata> })?.data || (response as Partial<CreatorFilterMetadata>);
        return normalizeMetadata(payload);
      } catch {
        // Try the next endpoint before falling back to defaults.
      }
    }

    return defaultCreatorFilterMetadata;
  },
};
