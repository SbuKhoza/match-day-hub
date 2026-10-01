import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type { ThemeMode } from "@/types";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "kickoff:theme";

/**
 * The app currently ships with a single look (the PSL wallpaper theme), so the
 * theme is locked to LOCKED_THEME. The light/dark machinery below is intact:
 * set THEME_LOCKED to false and re-add <ThemeToggle /> to bring switching back.
 */
const THEME_LOCKED = true;
const LOCKED_THEME: ThemeMode = "dark";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(THEME_LOCKED ? LOCKED_THEME : "light");

  useEffect(() => {
    if (THEME_LOCKED) return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setThemeState(stored ?? (prefersDark ? "dark" : "light"));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
    if (!THEME_LOCKED) window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    if (THEME_LOCKED) return;
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    if (THEME_LOCKED) return;
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
