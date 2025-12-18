import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const applyTheme = (theme: Theme) => {
  if (typeof window === "undefined") return;
  
  const html = document.documentElement;
  
  // Force remove all theme classes
  html.classList.remove("light", "dark");
  
  // Apply the theme - only add 'dark' class for dark mode
  if (theme === "dark") {
    html.classList.add("dark");
  }
  
  // Double check it's applied
  requestAnimationFrame(() => {
    if (theme === "dark" && !html.classList.contains("dark")) {
      html.classList.add("dark");
    } else if (theme === "light" && html.classList.contains("dark")) {
      html.classList.remove("dark");
    }
  });
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme: () => {
        const current = get().theme;
        const next = current === "light" ? "dark" : "light";
        set({ theme: next });
        applyTheme(next);
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

