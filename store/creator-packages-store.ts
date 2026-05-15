import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { creatorPackages } from '@/data/creator-packages';
import type { CreatorPackage, PackageStatus } from '@/types';

interface CreatorPackagesState {
  packages: CreatorPackage[];
  createPackage: (pkg: CreatorPackage) => void;
  updatePackage: (id: string, pkg: CreatorPackage) => void;
  duplicatePackage: (id: string) => void;
  archivePackage: (id: string) => void;
  togglePausePackage: (id: string) => void;
}

export const useCreatorPackagesStore = create<CreatorPackagesState>()(
  persist(
    (set) => ({
      packages: creatorPackages,

      createPackage: (pkg) => {
        set((state) => ({
          packages: [pkg, ...state.packages],
        }));
      },

      updatePackage: (id, pkg) => {
        set((state) => ({
          packages: state.packages.map((item) => (item.id === id ? pkg : item)),
        }));
      },

      duplicatePackage: (id) => {
        set((state) => {
          const target = state.packages.find((item) => item.id === id);
          if (!target) return state;

          const duplicate: CreatorPackage = {
            ...target,
            id: `cp-${Date.now()}`,
            title: `${target.title} (Copy)`,
            status: 'draft',
            visibility: 'private',
          };

          return {
            packages: [duplicate, ...state.packages],
          };
        });
      },

      archivePackage: (id) => {
        set((state) => ({
          packages: state.packages.map((item) =>
            item.id === id ? { ...item, status: 'archived' as PackageStatus } : item
          ),
        }));
      },

      togglePausePackage: (id) => {
        set((state) => ({
          packages: state.packages.map((item) => {
            if (item.id !== id) return item;

            return {
              ...item,
              status: item.status === 'paused' ? 'active' : 'paused',
            };
          }),
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

