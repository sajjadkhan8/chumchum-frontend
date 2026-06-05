import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tokenStorage } from '@/lib/api/client';
import { mapUser } from '@/lib/api/mappers';
import { authService } from '@/services/auth.service';
import { savedCreatorsService } from '@/services/saved-creators.service';
import { isValidPakistaniPhone, normalizePakistaniPhone } from '@/lib/phone-utils';
import type { User, UserRole, Creator, Brand } from '@/types';

interface AuthState {
  user: User | null;
  creatorProfile: Creator | null;
  brandProfile: Brand | null;
  savedCreators: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestOtp: (phone: string) => Promise<void>;
  loginWithPhone: (phone: string, otp: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setCreatorProfile: (profile: Creator) => void;
  setBrandProfile: (profile: Brand) => void;
  loadSavedCreators: () => Promise<void>;
  toggleSavedCreator: (creatorId: string) => Promise<void>;
  markHydrated: () => void;
}

const syncSavedCreators = async (): Promise<string[]> => {
  const response = await savedCreatorsService.getAll();
  return response.creators.map((creator) => creator.id);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      creatorProfile: null,
      brandProfile: null,
      savedCreators: [],
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);
          tokenStorage.set(response.accessToken, response.refreshToken);

          const user = mapUser(response.user);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            hasHydrated: true,
          });

          if (user.role === 'brand') {
            await get().loadSavedCreators();
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      requestOtp: async (phone: string) => {
        if (!isValidPakistaniPhone(phone)) {
          throw new Error('Please enter a valid Pakistani phone number.');
        }
        const normalizedPhone = normalizePakistaniPhone(phone);
        await authService.sendOtp(normalizedPhone);
      },

      loginWithPhone: async (phone: string, otp: string) => {
        set({ isLoading: true });
        try {
          if (!isValidPakistaniPhone(phone)) {
            throw new Error('Please enter a valid Pakistani phone number.');
          }
          const normalizedPhone = normalizePakistaniPhone(phone);
          const response = await authService.verifyOtp(normalizedPhone, otp);
          tokenStorage.set(response.accessToken, response.refreshToken);

          const user = mapUser(response.user);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            hasHydrated: true,
          });

          if (user.role === 'brand') {
            await get().loadSavedCreators();
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email: string, password: string, role: UserRole, name: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.signup(email, password, role, name);
          tokenStorage.set(response.accessToken, response.refreshToken);

          const user = mapUser(response.user);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            hasHydrated: true,
          });

          if (user.role === 'brand') {
            await get().loadSavedCreators();
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Ignore logout failures and always clear local state.
        }

        tokenStorage.clear();
        set({
          user: null,
          creatorProfile: null,
          brandProfile: null,
          savedCreators: [],
          isAuthenticated: false,
          hasHydrated: true,
        });
      },

      markHydrated: () => {
        set((state) => {
          const hasUser = Boolean(state.user);
          return {
            hasHydrated: true,
            isAuthenticated: hasUser,
          };
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true, hasHydrated: true });
      },

      setCreatorProfile: (profile: Creator) => {
        set({ creatorProfile: profile });
      },

      setBrandProfile: (profile: Brand) => {
        set({ brandProfile: profile });
      },

      loadSavedCreators: async () => {
        const user = get().user;
        if (!user || user.role !== 'brand') return;

        try {
          const saved = await syncSavedCreators();
          set({ savedCreators: saved });
        } catch {
          // Keep local state as-is when sync fails.
        }
      },

      toggleSavedCreator: async (creatorId: string) => {
        const state = get();
        const isSaved = state.savedCreators.includes(creatorId);

        set({
          savedCreators: isSaved
            ? state.savedCreators.filter((id) => id !== creatorId)
            : [...state.savedCreators, creatorId],
        });

        try {
          if (isSaved) {
            await savedCreatorsService.remove(creatorId);
          } else {
            await savedCreatorsService.save(creatorId);
          }
        } catch {
          set({
            savedCreators: state.savedCreators,
          });
        }
      },
    }),
    {
      name: 'zingzing-auth',
      version: 3,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState as AuthState;
        }

        if (version < 3) {
          return {
            ...(persistedState as AuthState),
            user: null,
            creatorProfile: null,
            brandProfile: null,
            savedCreators: [],
            isAuthenticated: false,
          } satisfies Partial<AuthState> as AuthState;
        }

        return persistedState as AuthState;
      },
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
        if (state?.user?.role === 'brand') {
          void state.loadSavedCreators();
        }
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        creatorProfile: state.creatorProfile,
        brandProfile: state.brandProfile,
        savedCreators: state.savedCreators,
      }),
    },
  ),
);
