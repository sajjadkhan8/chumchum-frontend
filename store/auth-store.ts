import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  loginWithPhone: (phone: string, otp: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setCreatorProfile: (profile: Creator) => void;
  setBrandProfile: (profile: Brand) => void;
  toggleSavedCreator: (creatorId: string) => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      creatorProfile: null,
      brandProfile: null,
      savedCreators: [],
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: async (email: string, _password: string) => {
        set({ isLoading: true });
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Mock user based on email
        const isCreator = email.includes('creator');
        const mockUser: User = {
          id: '1',
          email,
          role: isCreator ? 'creator' : 'brand',
          name: isCreator ? 'Ali Khan' : 'FoodPanda Pakistan',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          createdAt: new Date(),
        };
        
        set({ user: mockUser, isAuthenticated: true, isLoading: false, hasHydrated: true });
      },

      loginWithPhone: async (phone: string, _otp: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const mockUser: User = {
          id: '1',
          phone,
          email: '',
          role: 'creator',
          name: 'Hassan Raza',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
          createdAt: new Date(),
        };
        
        set({ user: mockUser, isAuthenticated: true, isLoading: false, hasHydrated: true });
      },

      signup: async (email: string, _password: string, role: UserRole, name: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const mockUser: User = {
          id: Date.now().toString(),
          email,
          role,
          name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          createdAt: new Date(),
        };
        
        set({ user: mockUser, isAuthenticated: true, isLoading: false, hasHydrated: true });
      },

      logout: () => {
        set({ user: null, creatorProfile: null, brandProfile: null, isAuthenticated: false, hasHydrated: true });
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

      toggleSavedCreator: (creatorId: string) => {
        set((state) => ({
          savedCreators: state.savedCreators.includes(creatorId)
            ? state.savedCreators.filter((id) => id !== creatorId)
            : [...state.savedCreators, creatorId],
        }));
      },
    }),
    {
      name: 'chamcham-auth',
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState as AuthState;
        }

        // Reset legacy persisted auth snapshots to prevent false "logged in" UI.
        if (version < 2) {
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
      },
      partialize: (state) => ({
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        creatorProfile: state.creatorProfile,
        brandProfile: state.brandProfile,
        savedCreators: state.savedCreators,
      }),
    }
  )
);
