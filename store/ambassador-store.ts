import { create } from 'zustand';
import type { AmbassadorApplication } from '@/types';
import { ambassadorApplications } from '@/data/ambassadors';

interface AmbassadorStore {
  applications: AmbassadorApplication[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchApplications: () => void;
  submitApplication: (creatorId: string) => Promise<void>;
  getApplicationStatus: (creatorId: string) => AmbassadorApplication | undefined;
  updateApplicationStatus: (appId: string, status: any) => void;
}

export const useAmbassadorStore = create<AmbassadorStore>((set) => ({
  applications: ambassadorApplications,
  loading: false,
  error: null,

  fetchApplications: async () => {
    set({ loading: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ applications: ambassadorApplications, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  submitApplication: async (creatorId: string) => {
    set({ loading: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newApplication: AmbassadorApplication = {
        id: `app-${Date.now()}`,
        creatorId,
        creator: null as any, // Would be fetched from API
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
        verificationSteps: {
          identityVerified: false,
          engagementVerified: false,
          contentReviewPassed: false,
          backgroundCheckPassed: false,
        },
        notes: 'Application submitted. Awaiting review by our team.',
      };

      set((state) => ({
        applications: [...state.applications, newApplication],
        error: null,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  getApplicationStatus: (creatorId: string) => {
    const state = useAmbassadorStore.getState();
    return state.applications.find((app) => app.creatorId === creatorId);
  },

  updateApplicationStatus: (appId: string, status: any) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === appId ? { ...app, status, updatedAt: new Date() } : app
      ),
    }));
  },
}));

