import { create } from 'zustand';
import type { AmbassadorApplication, AmbassadorApplicationStatus } from '@/types';
import { ambassadorService } from '@/services/ambassador.service';

interface AmbassadorStore {
  applications: AmbassadorApplication[];
  loading: boolean;
  error: string | null;

  fetchApplications: () => Promise<void>;
  submitApplication: (creatorId: string) => Promise<void>;
  getApplicationStatus: (creatorId: string) => AmbassadorApplication | undefined;
  updateApplicationStatus: (appId: string, status: AmbassadorApplicationStatus) => void;
}

export const useAmbassadorStore = create<AmbassadorStore>()((set, get) => ({
  applications: [],
  loading: false,
  error: null,

  fetchApplications: async () => {
    set({ loading: true });
    try {
      const application = await ambassadorService.getMyApplication();
      set({ applications: application ? [application] : [], error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  submitApplication: async (_creatorId: string) => {
    set({ loading: true });
    try {
      const created = await ambassadorService.submitApplication();
      set({
        applications: [created, ...get().applications.filter((item) => item.id !== created.id)],
        error: null,
      });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getApplicationStatus: (creatorId: string): AmbassadorApplication | undefined => {
    return get().applications.find((app) => app.creatorId === creatorId);
  },

  updateApplicationStatus: (appId: string, status: AmbassadorApplicationStatus) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === appId ? { ...app, status, updatedAt: new Date() } : app
      ),
    }));
  },
}));
