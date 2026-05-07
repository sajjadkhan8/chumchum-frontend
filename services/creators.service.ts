import type { Creator, CreatorFilters } from '@/types';
import { mockCreators } from '@/data/creators';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const creatorsService = {
  async getAll(filters?: CreatorFilters): Promise<Creator[]> {
    await delay(800);
    
    let results = [...mockCreators];

    if (filters) {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(
          (creator) =>
            creator.name.toLowerCase().includes(searchLower) ||
            creator.bio.toLowerCase().includes(searchLower) ||
            creator.categories.some((cat) => cat.toLowerCase().includes(searchLower)) ||
            creator.city.toLowerCase().includes(searchLower)
        );
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        results = results.filter((creator) =>
          creator.categories.some((cat) => filters.categories!.includes(cat))
        );
      }

      // Platform filter
      if (filters.platforms && filters.platforms.length > 0) {
        results = results.filter((creator) =>
          creator.platforms.some((p) => filters.platforms!.includes(p.platform))
        );
      }

      // City filter
      if (filters.cities && filters.cities.length > 0) {
        results = results.filter((creator) => filters.cities!.includes(creator.city));
      }

      // Deal type filter
      if (filters.dealTypes && filters.dealTypes.length > 0) {
        results = results.filter((creator) =>
          creator.dealTypes.some((dt) => filters.dealTypes!.includes(dt))
        );
      }

      // Barter type filter
      if (filters.barterTypes && filters.barterTypes.length > 0) {
        results = results.filter(
          (creator) =>
            creator.barterTypes &&
            creator.barterTypes.some((bt) => filters.barterTypes!.includes(bt))
        );
      }

      // Followers filter
      if (filters.minFollowers !== undefined) {
        results = results.filter((creator) => creator.totalFollowers >= filters.minFollowers!);
      }
      if (filters.maxFollowers !== undefined) {
        results = results.filter((creator) => creator.totalFollowers <= filters.maxFollowers!);
      }

      // Rating filter
      if (filters.minRating !== undefined) {
        results = results.filter((creator) => creator.rating >= filters.minRating!);
      }

      // Price filter
      if (filters.minPrice !== undefined) {
        results = results.filter(
          (creator) => creator.minPrice && creator.minPrice >= filters.minPrice!
        );
      }
      if (filters.maxPrice !== undefined) {
        results = results.filter(
          (creator) => creator.maxPrice && creator.maxPrice <= filters.maxPrice!
        );
      }

      // Sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'trending':
            results = results.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0));
            break;
          case 'budget_friendly':
            results = results.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
            break;
          case 'top_rated':
            results = results.sort((a, b) => b.rating - a.rating);
            break;
          case 'near_you':
            // In a real app, this would use geolocation
            results = results.sort((a, b) => a.city.localeCompare(b.city));
            break;
        }
      }
    }

    return results;
  },

  async getById(id: string): Promise<Creator | null> {
    await delay(500);
    return mockCreators.find((creator) => creator.id === id) || null;
  },

  async getByUsername(username: string): Promise<Creator | null> {
    await delay(500);
    return mockCreators.find((creator) => creator.username === username) || null;
  },

  async getTrending(limit: number = 6): Promise<Creator[]> {
    await delay(600);
    return mockCreators.filter((creator) => creator.isTrending).slice(0, limit);
  },

  async getBarterFriendly(limit: number = 6): Promise<Creator[]> {
    await delay(600);
    return mockCreators
      .filter((creator) => creator.dealTypes.includes('barter'))
      .slice(0, limit);
  },

  async getFastResponders(limit: number = 6): Promise<Creator[]> {
    await delay(600);
    return mockCreators.filter((creator) => creator.isFastResponder).slice(0, limit);
  },

  async getByCity(city: string, limit: number = 6): Promise<Creator[]> {
    await delay(600);
    return mockCreators.filter((creator) => creator.city === city).slice(0, limit);
  },
};
