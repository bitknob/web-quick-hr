"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/store/theme-store";

export function ThemeInitializer() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // Ensure theme is applied on mount
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    if (theme === "dark") {
      html.classList.add("dark");
    }
  }, [theme]);

  return null;
}
