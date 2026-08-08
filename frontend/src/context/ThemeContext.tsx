"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ScanzaTheme = "light" | "dark" | "ocean" | "sunset";

const THEME_STORAGE_KEY = "scanza-theme";
const ALL_THEMES: ScanzaTheme[] = ["light", "dark", "ocean", "sunset"];

interface ThemeContextValue {
  theme: ScanzaTheme;
  setTheme: (theme: ScanzaTheme) => void;
  cycleTheme: () => void;
  allThemes: ScanzaTheme[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ScanzaTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Read persisted preference (or OS preference as a sane default) once on mount.
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ScanzaTheme | null;
    if (stored && ALL_THEMES.includes(stored)) {
      setThemeState(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setThemeState("dark");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = useCallback((next: ScanzaTheme) => {
    setThemeState(next);
  }, []);

  const cycleTheme = useCallback(() => {
    const idx = ALL_THEMES.indexOf(theme);
    setTheme(ALL_THEMES[(idx + 1) % ALL_THEMES.length]);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, allThemes: ALL_THEMES }}>
      <div className="scanza-theme-transition">{children}</div>
    </ThemeContext.Provider>
  );
}
