/* From Uiverse.io by FColombati */
"use client"

import { useThemeContext } from "@/contexts/providers/theme-context"

export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useThemeContext()

  return (
    <div
      className="relative flex items-center justify-center shrink-0 px-1"
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-pressed={isDarkMode}
        className="uiverse-mode-btn"
      >
        <div className="uiverse-mode-btn-outer">
          <div className="uiverse-mode-btn-inner">
            <span className="uiverse-mode-btn-glyph flex items-center justify-center">
              {isDarkMode ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                </svg>
              ) : (
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
                </svg>
              )}
            </span>
          </div>
        </div>
      </button>
    </div>
  )
}
