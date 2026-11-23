"use client"

import { useThemeContext } from "@/contexts/providers/theme-context"

/**
 * Uiverse 3D Tactile Push-Button Theme Switcher (Option 4: Minimal Platinum Sun)
 *
 * Implements the convex 3D push-button physics by Nagalapuramhareeswar:
 * - Ceramic white convex disc with specular depth highlights
 * - Radiant amber sun filament glyph (☼) with warm corona bloom in Light Mode
 * - Deep space obsidian disc with glowing starlight crescent (☽) in Dark Mode
 * - Tactile press physics with smooth cubic-bezier transitions
 */
export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useThemeContext()

  return (
    <div className="relative flex items-center justify-center shrink-0 px-1" title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      <label className="relative w-10 h-10 sm:w-11 sm:h-11 inline-flex items-center justify-center cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isDarkMode}
          onChange={toggleTheme}
          aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
        />

        {/* Ambient Halo / Corona */}
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none scale-125 ${
            isDarkMode
              ? "bg-[radial-gradient(circle,rgba(147,197,253,0.25)_0%,transparent_70%)]"
              : "bg-[radial-gradient(circle,rgba(245,158,11,0.35)_0%,transparent_70%)]"
          }`}
        />

        {/* 3D Convex Button Body */}
        <span
          aria-hidden="true"
          style={
            isDarkMode
              ? {
                  background: "linear-gradient(160deg, #272C36 0%, #171A21 65%, #0F1216 100%)",
                  boxShadow:
                    "0 6px 16px -2px rgba(0, 0, 0, 0.65), inset 0 1.5px 2px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)",
                }
              : {
                  background: "linear-gradient(150deg, #FFFFFF 0%, #F8FAFC 60%, #E2E8F0 100%)",
                  boxShadow:
                    "0 6px 16px -2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.04), inset 0 2px 3px #FFFFFF, inset 0 -2px 3px rgba(148, 163, 184, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.06)",
                }
          }
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-none active:scale-90"
        >
          {/* Glyph */}
          <span
            style={
              isDarkMode
                ? {
                    color: "#93C5FD",
                    textShadow: "0 0 10px rgba(147, 197, 253, 0.6)",
                  }
                : {
                    color: "#D97706",
                    textShadow: "0 0 10px rgba(245, 158, 11, 0.7), 0 0 18px rgba(251, 191, 36, 0.45)",
                  }
            }
            className="text-base sm:text-lg font-black leading-none select-none transition-colors duration-300"
          >
            {isDarkMode ? "☽" : "☼"}
          </span>
        </span>
      </label>
    </div>
  )
}
