"use client"

import { Sun, Moon } from "lucide-react"
import { useThemeContext } from "@/contexts/providers/theme-context"

export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useThemeContext()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--foreground)] opacity-70 hover:opacity-100 transition-all"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
