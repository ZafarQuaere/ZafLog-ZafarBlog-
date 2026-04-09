"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyMode(m: ThemeMode) {
  if (typeof document === "undefined") return;
  localStorage.setItem("theme", m);
  document.documentElement.classList.toggle("dark", m === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: ThemeMode = stored ?? (prefersDark ? "dark" : "light");
    queueMicrotask(() => {
      setModeState(initial);
      applyMode(initial);
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    applyMode(m);
  }, []);

  const toggle = useCallback(() => {
    setModeState((m) => {
      const next: ThemeMode = m === "dark" ? "light" : "dark";
      applyMode(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
