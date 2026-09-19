"use client"

import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export interface MonthOption {
  key: string;
  label: string;
}

interface HeaderProps {
  title?: string;
  isDarkMode?: boolean;
  selectedMonth: string;
  months: MonthOption[];
  onMonthChange: (key: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Overview',
  isDarkMode = false,
  selectedMonth,
  months,
  onMonthChange,
}) => {
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  return (
    <header
      id="dashboard-header"
      className="w-full py-5 flex items-center justify-between"
    >
      <h1
        id="dashboard-big-title"
        className={`text-[28px] sm:text-3xl font-bold tracking-tight ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        {title}
      </h1>

      <div className="flex items-center gap-3.5">
        <div className="relative">
          <button
            id="month-filter-button"
            onClick={() => setShowMonthDropdown(!showMonthDropdown)}
            className={`h-10 px-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
              isDarkMode
                ? 'bg-[#212427] border-gray-700 text-gray-200 hover:bg-gray-800'
                : 'bg-white border-gray-200/90 text-gray-700 hover:bg-gray-50'
            } shadow-xs cursor-pointer`}
          >
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{selectedMonth}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
          </button>

          {showMonthDropdown && (
            <div
              className={`absolute right-0 mt-1.5 w-40 py-1.5 rounded-xl shadow-lg border z-50 ${
                isDarkMode ? 'bg-[#25282c] border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'
              }`}
            >
              <button
                onClick={() => {
                  onMonthChange(null);
                  setShowMonthDropdown(false);
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs font-medium hover:bg-[#98e4af]/20 transition cursor-pointer"
              >
                All time
              </button>
              {months.map((m) => (
                <button
                  key={m.key}
                  onClick={() => {
                    onMonthChange(m.key);
                    setShowMonthDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs font-medium hover:bg-[#98e4af]/20 transition cursor-pointer ${
                    selectedMonth === m.label ? 'font-bold text-gray-900 dark:text-white' : ''
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
