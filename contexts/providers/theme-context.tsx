"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { readThemeFromStorage, writeThemeToStorage } from "@/lib/storage"

/**
 * Theme — light/dark, persisted to localStorage, applied via `.dark` on <html>.
 * Split from the old ShopContext so theme toggles don't re-render the catalog.
 */

type ThemeContextValue = {
  isDarkMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const saved = readThemeFromStorage()
    if (saved) setIsDarkMode(saved === "dark")
  }, [])

  // Reflect theme on <html> + persist.
  useEffect(() => {
    const html = document.documentElement
    if (isDarkMode) {
      html.classList.add("dark")
      writeThemeToStorage("dark")
    } else {
      html.classList.remove("dark")
      writeThemeToStorage("light")
    }
  }, [isDarkMode])

  const toggleTheme = useCallback(() => setIsDarkMode((prev) => !prev), [])

  const value = useMemo(() => ({ isDarkMode, toggleTheme }), [isDarkMode, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext)
  if (ctx === undefined) throw new Error("useThemeContext must be used within ThemeProvider")
  return ctx
}
