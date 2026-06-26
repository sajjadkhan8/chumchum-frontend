import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  packagesService,
  type PackageDealTypeRequest,
  type PackagePlatformRequest,
  type PackageStatusRequest,
  type PackageUpsertRequest,
} from '@/services/packages.service';
import { normalizeCategory } from '@/lib/categories';
import type { CreatorPackage, PackageStatus } from '@/types';

interface CreatorPackagesState {
  packages: CreatorPackage[];
  isLoading: boolean;
  fetchPackages: () => Promise<void>;
  fetchPackageById: (id: string) => Promise<CreatorPackage | null>;
  createPackage: (pkg: CreatorPackage) => Promise<void>;
  updatePackage: (id: string, pkg: CreatorPackage) => Promise<void>;
  duplicatePackage: (id: string) => Promise<void>;
  archivePackage: (id: string) => Promise<void>;
  togglePausePackage: (id: string) => Promise<void>;
}

const cleanList = (values: string[] = []) => values.map((value) => value.trim()).filter(Boolean);
const toPackagePlatform = (value: string): PackagePlatformRequest => value.toUpperCase() as PackagePlatformRequest;
const toPackageDealType = (value: string): PackageDealTypeRequest => value.toUpperCase() as PackageDealTypeRequest;
const toPackageStatus = (value: string): PackageStatusRequest => value.toUpperCase() as PackageStatusRequest;

const toCreateRequest = (pkg: CreatorPackage): PackageUpsertRequest => ({
  name: pkg.title,
  title: pkg.title,
  short_description: pkg.shortDescription,
  description: pkg.description,
  full_description: pkg.fullDescription,
  platform: toPackagePlatform(pkg.platform),
  category: normalizeCategory(pkg.category) || undefined,
  deal_type: toPackageDealType(pkg.dealType),
  barter_details: pkg.barterDescription || pkg.barterValue,
  barter_description: pkg.barterDescription,
  barter_category: pkg.barterCategory,
  estimated_barter_value: pkg.estimatedBarterValue,
  hybrid_cash_amount: pkg.hybridCashAmount,
  hybrid_barter_value: pkg.hybridBarterValue,
  creator_expectations: pkg.creatorExpectations,
  price: Math.max(0, pkg.price || 0),
  currency: 'PKR',
  deliverables: cleanList(pkg.deliverables),
  delivery_days: pkg.deliveryDays,
  revisions: pkg.revisions,
  status: toPackageStatus(pkg.status),
  visibility: pkg.visibility,
  response_time: pkg.responseTime,
  cover_image: pkg.thumbnail,
  media_urls: cleanList(pkg.mediaUrls),
  tags: cleanList(pkg.tags),
  is_active: pkg.status === 'active',
});

export const useCreatorPackagesStore = create<CreatorPackagesState>()(
  persist(
    (set, get) => ({
      packages: [],
      isLoading: false,

      fetchPackages: async () => {
        set({ isLoading: true });
        try {
          const packages = await packagesService.getMine();
          set({ packages, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      fetchPackageById: async (id) => {
        const existing = get().packages.find((item) => item.id === id);
        if (existing) return existing;

        const pkg = await packagesService.getById(id);
        if (!pkg) return null;

        set((state) => ({
          packages: state.packages.some((item) => item.id === id)
            ? state.packages.map((item) => (item.id === id ? pkg : item))
            : [pkg, ...state.packages],
        }));
        return pkg;
      },

      createPackage: async (pkg) => {
        const created = await packagesService.create(toCreateRequest(pkg));
        set((state) => ({
          packages: [created, ...state.packages],
        }));
      },

      updatePackage: async (id, pkg) => {
        const updated = await packagesService.update(id, toCreateRequest(pkg));
        set((state) => ({
          packages: state.packages.map((item) => (item.id === id ? { ...item, ...updated } : item)),
        }));
      },

      duplicatePackage: async (id) => {
        const duplicated = await packagesService.duplicate(id);
        set((state) => ({
          packages: [duplicated, ...state.packages],
        }));
      },

      archivePackage: async (id) => {
        const archived = await packagesService.updateStatus(id, 'archived');
        set((state) => ({
          packages: state.packages.map((item) => (item.id === id ? { ...item, ...archived } : item)),
        }));
      },

      togglePausePackage: async (id) => {
        const current = get().packages.find((item) => item.id === id);
        if (!current) return;

        const nextStatus: PackageStatus = current.status === 'paused' ? 'active' : 'paused';
        const updated = await packagesService.updateStatus(id, nextStatus);

        set((state) => ({
          packages: state.packages.map((item) => (item.id === id ? { ...item, ...updated } : item)),
        }));
      },
    }),
    {
      name: 'creator-packages-studio',
      partialize: (state) => ({
        packages: state.packages,
      }),
    }
  )
);
