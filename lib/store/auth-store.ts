import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { User } from "../types";
import { authApi } from "../api/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({
            email,
            password,
            deviceType: "web",
          });
          set({
            user: response.response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      logout: () => {
        authApi.logout();
        set({ user: null, isAuthenticated: false });
      },
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const response = await authApi.getCurrentUser();
          set({
            user: response.response,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
