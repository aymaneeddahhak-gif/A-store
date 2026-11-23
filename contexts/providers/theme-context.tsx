"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { readThemeFromStorage, writeThemeToStorage } from "@/lib/storage"

/**
 * Theme — light/dark, persisted to localStorage and applied to <html> via the
 * `.dark` class. The initial value is applied by the blocking script in
 * app/layout.tsx, so the state here is seeded from the DOM to avoid a flash of
 * the wrong palette.
 * Split from the old ShopContext so theme toggles don't re-render the catalog.
 */

type ThemeContextValue = {
  isDarkMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Light is the official default — dark mode applies only when the user
  // explicitly picked it (persisted "dark" in localStorage).
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Adopt whatever the pre-paint script already applied.
  useEffect(() => {
    setIsDarkMode(readThemeFromStorage() === "dark")
    setHydrated(true)
  }, [])

  // Reflect theme on <html> + persist. Skipped until hydration so the initial
  // default can't overwrite the stored preference.
  useEffect(() => {
    if (!hydrated) return
    document.documentElement.classList.toggle("dark", isDarkMode)
    writeThemeToStorage(isDarkMode ? "dark" : "light")
  }, [isDarkMode, hydrated])

  const toggleTheme = useCallback(() => setIsDarkMode((prev) => !prev), [])

  const value = useMemo(() => ({ isDarkMode, toggleTheme }), [isDarkMode, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext)
  if (ctx === undefined) throw new Error("useThemeContext must be used within ThemeProvider")
  return ctx
}
