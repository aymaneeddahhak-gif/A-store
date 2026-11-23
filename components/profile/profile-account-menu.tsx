'use client';

import React from 'react';
import {
  Heart,
  ShoppingBag,
  MapPin,
  CreditCard,
  Globe,
  LogOut,
  Camera,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { UserAvatar } from '@/components/avatars/role-avatar';

export type ProfileTab = 'favourites' | 'orders' | 'address' | 'payment' | 'language';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  language: string;
}

interface ProfileAccountMenuProps {
  user: UserProfile;
  activeTab: ProfileTab;
  ordersCount: number;
  favouritesCount: number;
  onTabSelect: (tab: ProfileTab) => void;
  onLogout: () => void;
  onAvatarChange: () => void;
}

/**
 * The user's ProfileAccountMenu design, verbatim — avatar circle with camera
 * badge, role pill, and the rounded menu rows with counts + chevrons.
 * Live data is passed in; tab switching is controlled by the profile page.
 */
export default function ProfileAccountMenu({
  user,
  activeTab,
  ordersCount,
  favouritesCount,
  onTabSelect,
  onLogout,
  onAvatarChange,
}: ProfileAccountMenuProps) {
  const menuItems = [
    { id: 'favourites' as ProfileTab, label: 'Favourites', icon: Heart, count: String(favouritesCount), detail: null as string | null },
    { id: 'orders' as ProfileTab, label: 'My Orders', icon: ShoppingBag, count: String(ordersCount), detail: null as string | null },
    { id: 'address' as ProfileTab, label: 'Address', icon: MapPin, count: null as string | null, detail: null as string | null },
    { id: 'payment' as ProfileTab, label: 'Payment', icon: CreditCard, count: null as string | null, detail: null as string | null },
    { id: 'language' as ProfileTab, label: 'Language', icon: Globe, count: null as string | null, detail: user.language },
  ];

  return (
    <aside className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between">
      <div>
        {/* User Avatar & Info */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-gray-50 shadow-sm bg-gray-100 flex items-center justify-center">
              <UserAvatar
                src={user.avatarUrl}
                alt={user.name}
                email={user.email}
                size={80}
                sizeClass="w-20 h-20"
              />
            </div>
            <button
              type="button"
              onClick={onAvatarChange}
              title="Change avatar photo"
              className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-gray-700" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{user.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>

          <span className="inline-flex items-center gap-1 mt-2.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{user.role}</span>
          </span>
        </div>

        {/* Navigation Menu Links */}
        <nav className="mt-5 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#eb483f] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.count !== null && item.count !== '0' && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  {item.detail && (
                    <span
                      className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}
                    >
                      {item.detail}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`}
                  />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="pt-6 mt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-2xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
