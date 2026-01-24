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
  login: (email: string, password: string) => Promise<{ mustChangePassword?: boolean }>;
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
          
          const { user } = response.response;
          const mustChangePassword = user.mustChangePassword;
          
          if (mustChangePassword) {
            // Don't set user as authenticated if password change is required
            set({ user, isAuthenticated: false, isLoading: false });
            return { mustChangePassword: true };
          } else {
            // Set user as authenticated
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            return { mustChangePassword: false };
          }
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
