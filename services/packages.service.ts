import type { Package } from '@/types';
import { mockPackages, getPackagesByCreatorId, getPackageById } from '@/data/packages';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const packagesService = {
  async getAll(): Promise<Package[]> {
    await delay(500);
    return mockPackages;
  },

  async getById(id: string): Promise<Package | null> {
    await delay(300);
    return getPackageById(id) || null;
  },

  async getByCreatorId(creatorId: string): Promise<Package[]> {
    await delay(400);
    return getPackagesByCreatorId(creatorId);
  },

  async getPopular(limit: number = 6): Promise<Package[]> {
    await delay(500);
    return mockPackages
      .filter((pkg) => pkg.isPopular)
      .sort((a, b) => b.ordersCompleted - a.ordersCompleted)
      .slice(0, limit);
  },
};
