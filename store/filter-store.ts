import { create } from 'zustand';
import type { CreatorFilters } from '@/types';

interface FilterState {
  filters: CreatorFilters;
  isFilterPanelOpen: boolean;
  setFilters: (filters: Partial<CreatorFilters>) => void;
  resetFilters: () => void;
  toggleFilterPanel: () => void;
  setFilterPanelOpen: (open: boolean) => void;
}

const defaultFilters: CreatorFilters = {
  search: '',
  categories: [],
  platforms: [],
  cities: [],
  dealTypes: [],
  barterTypes: [],
  sortBy: 'trending',
};

export const useFilterStore = create<FilterState>((set) => ({
  filters: defaultFilters,
  isFilterPanelOpen: false,

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () =>
    set({ filters: defaultFilters }),

  toggleFilterPanel: () =>
    set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),

  setFilterPanelOpen: (open) =>
    set({ isFilterPanelOpen: open }),
}));
