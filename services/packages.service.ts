import { apiClient } from '@/lib/api/client';
import { mapPackage, mergePackageAnalytics } from '@/lib/api/mappers';
import type { CreatorPackage, Package, PackageAnalytics, PackageStatus } from '@/types';

interface PaginatedPackages {
  content?: unknown[];
}

const normalizePackages = (payload: unknown): CreatorPackage[] => {
  if (Array.isArray(payload)) {
    return payload.map((item) => mapPackage(item as never));
  }

  const response = payload as PaginatedPackages;
  return (response.content || []).map((item) => mapPackage(item as never));
};

export const packagesService = {
  async getAll(): Promise<CreatorPackage[]> {
    const payload = await apiClient.get<unknown>('/api/v1/packages', {
      query: { size: 100, sort: 'createdAt' },
    });
    return normalizePackages(payload);
  },

  async getMine(params?: {
    search?: string;
    status?: string;
    dealType?: string;
    platform?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<CreatorPackage[]> {
    const payload = await apiClient.get<unknown>('/api/v1/packages', {
      query: {
        search: params?.search,
        status: params?.status,
        dealType: params?.dealType,
        platform: params?.platform,
        page: params?.page ?? 0,
        size: params?.size ?? 100,
        sort: params?.sort ?? 'createdAt',
      },
    });

    return normalizePackages(payload);
  },

  async getById(id: string): Promise<CreatorPackage | null> {
    const response = await apiClient.get<unknown>(`/api/v1/packages/${id}`, { auth: false });
    if (!response) return null;

    const mapped = mapPackage(response as never);
    const analytics = await this.getAnalytics(id).catch(() => null);
    return analytics ? mergePackageAnalytics(mapped, analytics) : mapped;
  },

  async getByCreatorId(creatorId: string): Promise<Package[]> {
    if (!creatorId) return [];

    const response = await apiClient.get<unknown>('/api/v1/packages', {
      query: { creatorId: creatorId, page: 0, size: 50, sort: 'createdAt' },
    });

    return normalizePackages(response);
  },

  async getPopular(limit = 6): Promise<Package[]> {
    const all = await this.getAll();
    return all
      .filter((pkg) => pkg.isPopular)
      .sort((a, b) => b.ordersCompleted - a.ordersCompleted)
      .slice(0, limit);
  },

  async create(payload: Record<string, unknown>): Promise<CreatorPackage> {
    const response = await apiClient.post<unknown>('/api/v1/packages', payload);
    return mapPackage(response as never);
  },

  async update(id: string, payload: Record<string, unknown>): Promise<CreatorPackage> {
    const response = await apiClient.patch<unknown>(`/api/v1/packages/${id}`, payload);
    return mapPackage(response as never);
  },

  async updateStatus(id: string, status: PackageStatus): Promise<CreatorPackage> {
    const response = await apiClient.patch<unknown>(`/api/v1/packages/${id}/status`, { status: status.toUpperCase() });
    return mapPackage(response as never);
  },

  async duplicate(id: string): Promise<CreatorPackage> {
    const response = await apiClient.post<unknown>(`/api/v1/packages/${id}/duplicate`);
    return mapPackage(response as never);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/packages/${id}`);
  },

  async getAnalytics(id: string): Promise<PackageAnalytics | null> {
    const response = await apiClient.get<Partial<PackageAnalytics>>(`/api/v1/packages/${id}/analytics`);

    if (!response) return null;

    return {
      views: response.views || 0,
      clicks: response.clicks || 0,
      inquiries: response.inquiries || 0,
      conversionRate: response.conversionRate || 0,
      completionRate: response.completionRate || 0,
      repeatBrands: response.repeatBrands || 0,
      engagementPerformance: response.engagementPerformance || 0,
    };
  },
};
