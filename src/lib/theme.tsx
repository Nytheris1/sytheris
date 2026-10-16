"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

export type ThemeId = "green" | "red" | "blue" | "purple" | "amber";

export interface Theme {
  id: ThemeId;
  tagline: string;
  accent: string;
}

export const THEMES: Theme[] = [
  { id: "green", tagline: "Green Zone", accent: "#00E676" },
  { id: "red", tagline: "Red Rebellion", accent: "#FF3B30" },
  { id: "blue", tagline: "Blue Horizon", accent: "#00B4FF" },
  { id: "purple", tagline: "Purple Reign", accent: "#A855F7" },
  { id: "amber", tagline: "Golden Hour", accent: "#FF9500" },
];

export const DEFAULT_THEME: ThemeId = "green";
export const THEME_STORAGE_KEY = "sytheris.theme.v1";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);

  // useLayoutEffect sadece tarayıcıda çalışır ve DOM güncellenmeden önce
  // tema özniteliğini ayarlayarak renk flash'ını önler.
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) {
        setThemeId(saved);
      }
    } catch {
      /* yoksay */
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", themeId);
  }, [themeId]);

  function setTheme(id: ThemeId) {
    setThemeId(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* yoksay */
    }
  }

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: THEMES[0],
      setTheme: () => {},
    } satisfies ThemeContextValue;
  }
  return ctx;
}