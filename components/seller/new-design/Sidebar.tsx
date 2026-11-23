"use client"

import React from 'react';
import {
  LayoutDashboard,
  Package,
  BadgePercent,
  ShoppingBag,
  Users,
  Mail,
  Sliders,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDarkMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isDarkMode,
}) => {
  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Products', label: 'Products', icon: Package },
    { id: 'Offers', label: 'Offers', icon: BadgePercent },
    { id: 'Orders', label: 'Orders', icon: ShoppingBag },
    { id: 'Customer', label: 'Customer', icon: Users },
    { id: 'Newsletter', label: 'Newsletter', icon: Mail },
    { id: 'Settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside
      id="sidebar-navigation"
      className={`w-80 shrink-0 py-6 px-4 hidden md:flex flex-col transition-colors rounded-[22px] border ${
        isDarkMode
          ? 'bg-[#181a1b] text-gray-200 border-gray-800'
          : 'bg-white text-gray-700 border-gray-100'
      }`}
    >
      <div className="space-y-4">
        <nav className="space-y-1" aria-label="Main Navigation">
          {menuItems.map((item) => {
            const IconComp = item.icon;
            const isActive =
              activeTab === item.id ||
              (activeTab === 'Overview' && item.id === 'Dashboard') ||
              (activeTab === 'Product' && item.id === 'Products');

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id.toLowerCase()}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#98e4af] text-gray-950 font-bold shadow-xs'
                    : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <IconComp
                    className={`w-5 h-5 stroke-[1.8] ${
                      isActive ? 'text-gray-950 stroke-[2.2]' : ''
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {isActive && (
                  <ChevronRight className="w-4 h-4 stroke-[2.5] text-gray-950" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
