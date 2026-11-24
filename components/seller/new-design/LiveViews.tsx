"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Mail, Trash2, Pin } from 'lucide-react';
import { VectorAvatar, avatarVariantForEmail } from '@/components/avatars/role-avatar';

export interface LiveCustomer {
  /** Stable identity for React keys — the customer user id. */
  userId: string;
  name: string;
  email: string;
  orders: number;
  total: string;
  tier: string;
  /** Most recent order date, pre-formatted for display. */
  lastOrder: string;
}

export interface LiveSubscriber {
  email: string;
  source: string;
  created_at: string;
}

/** One store product the admin can pin to the homepage showcase. */
export interface ShowcaseProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  featured: boolean;
}

// 1. CUSTOMERS VIEW — design shell, live rows via props.
export const CustomersView: React.FC<{
  isDarkMode?: boolean;
  customers: LiveCustomer[];
  tiers: string[];
  onShowToast?: (msg: string) => void;
}> = ({ isDarkMode, customers, tiers, onShowToast }) => {
  const [customerFilter, setCustomerFilter] = useState('All Customers');
  const [customerSearch, setCustomerSearch] = useState('');

  const filteredCustomers = customers.filter((cust) => {
    const matchesTier =
      customerFilter === 'All Customers' || cust.tier.toLowerCase() === customerFilter.toLowerCase();
    const matchesSearch =
      cust.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      cust.email.toLowerCase().includes(customerSearch.toLowerCase());
    return matchesTier && matchesSearch;
  });

  return (
    <div className={`p-6 rounded-[22px] border ${
      isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Customer Directory
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Registered accounts, purchase history, and lifetime value</p>
        </div>
        <button
          onClick={() => onShowToast?.('Exporting customer list...')}
          className="px-4 py-2 rounded-xl bg-[#98e4af] text-gray-950 text-xs font-bold hover:bg-[#88deb3] cursor-pointer active:scale-98"
        >
          Export Users
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 mb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {tiers.map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setCustomerFilter(tier)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-98 ${
                customerFilter === tier
                  ? 'bg-[#98e4af] text-gray-950 font-bold shadow-2xs'
                  : isDarkMode
                  ? 'bg-[#272a2e] text-gray-400 hover:bg-[#32363b]'
                  : 'bg-[#F3F4F6] text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="Search by name, email..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all ${
              isDarkMode
                ? 'bg-[#272a2e] text-gray-100 focus:ring-1 focus:ring-[#98e4af]'
                : 'bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]'
            }`}
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No customers match.</p>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.userId}
              className={`p-4 rounded-xl flex items-center justify-between border transition-all ${
                isDarkMode ? 'bg-[#272a2e] border-gray-800' : 'bg-[#F9FAFB] border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <VectorAvatar
                  variant={avatarVariantForEmail(cust.email)}
                  sizeClass="w-10 h-10"
                />
                <div>
                  <h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{cust.name}</h4>
                  <p className="text-xs text-gray-400">{cust.email}</p>
                  {cust.lastOrder && (
                    <p className="text-[11px] text-gray-400">Last order {cust.lastOrder}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="block text-xs font-bold">{cust.orders} orders</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-[#98e4af]">{cust.total} spent</span>
                </div>
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#98e4af]/20 text-gray-900 dark:text-[#98e4af]">
                  {cust.tier}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 3. SETTINGS VIEW — same design, values controlled + persisted to store_settings.
export const SettingsView: React.FC<{
  isDarkMode?: boolean;
  storeName: string;
  currency: string;
  notificationEmail: string;
  canSave: boolean;
  onSave: (s: { store_name: string; currency: string; notification_email: string }) => void;
  /** Store products the admin can pin to the homepage showcase. */
  showcase: ShowcaseProduct[];
  canManageShowcase: boolean;
  onToggleShowcase: (productId: string, featured: boolean) => void;
}> = ({
  isDarkMode,
  storeName,
  currency,
  notificationEmail,
  canSave,
  onSave,
  showcase,
  canManageShowcase,
  onToggleShowcase,
}) => {
  const [name, setName] = useState(storeName);
  const [curr, setCurr] = useState(currency);
  const [email, setEmail] = useState(notificationEmail);
  const [showcaseQuery, setShowcaseQuery] = useState('');

  const pinnedCount = showcase.filter((p) => p.featured).length;
  const showcaseResults = showcase.filter((p) => {
    const q = showcaseQuery.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className={`p-6 rounded-[22px] border ${
      isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      <div className="mb-6">
        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Store Preferences
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Manage currency, notifications, and team permissions</p>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Store Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${
              isDarkMode ? 'bg-[#272a2e] border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Primary Currency</label>
          <select
            value={curr}
            onChange={(e) => setCurr(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${
              isDarkMode ? 'bg-[#272a2e] border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <option value="USD">USD ($ - United States Dollar)</option>
            <option value="EUR">EUR (€ - Euro)</option>
            <option value="GBP">GBP (£ - British Pound)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Notification Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@store.com"
            className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${
              isDarkMode ? 'bg-[#272a2e] border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
            }`}
          />
        </div>

        <button
          onClick={() => canSave && onSave({ store_name: name, currency: curr, notification_email: email })}
          className="px-5 py-2.5 rounded-xl bg-[#98e4af] text-gray-950 font-bold text-xs hover:bg-[#88deb3] cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canSave}
          title={canSave ? undefined : 'Restricted to the store admin.'}
        >
          Save Changes
        </button>
        {!canSave && (
          <p className="text-[11px] text-gray-400">Only the store admin can save changes.</p>
        )}
      </div>

      {/* Homepage showcase — pinned products own the moving showcase at the top of the store. */}
      <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Homepage Showcase
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Pinned products take the moving showcase at the top of the website; the rest stay in the catalog.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#98e4af] text-gray-950">
            {pinnedCount} pinned
          </span>
        </div>

        <div className="relative mb-3 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={showcaseQuery}
            onChange={(e) => setShowcaseQuery(e.target.value)}
            placeholder="Search products to pin..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none ${
              isDarkMode ? 'bg-[#272a2e] border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
            }`}
          />
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {showcaseResults.length === 0 ? (
            <div
              className={`p-6 rounded-2xl text-center text-xs text-gray-400 border border-dashed ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              No products match your search.
            </div>
          ) : (
            showcaseResults.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border ${
                  isDarkMode ? 'bg-[#272a2e] border-gray-800' : 'bg-[#F9FAFB] border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <Image src={p.image} alt={p.name} width={40} height={40} unoptimized className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {p.name}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{p.category}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => canManageShowcase && onToggleShowcase(p.id, !p.featured)}
                  disabled={!canManageShowcase}
                  className={`shrink-0 h-8 px-3.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                    p.featured
                      ? 'bg-[#98e4af] text-gray-950 hover:bg-[#88deb3]'
                      : `border ${
                          isDarkMode
                            ? 'border-gray-700 text-gray-200 hover:border-gray-500'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`
                  } ${canManageShowcase ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                  title={
                    canManageShowcase ? undefined : 'Only the store admin can change the homepage showcase.'
                  }
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{p.featured ? 'On top' : 'Pin'}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {!canManageShowcase && (
          <p className="text-[11px] text-gray-400 mt-3">
            Only the store admin can change the homepage showcase.
          </p>
        )}
      </div>
    </div>
  );
};

// 4. NEWSLETTER VIEW — same design language, live subscribers via props.
export const NewsletterView: React.FC<{
  isDarkMode?: boolean;
  subscribers: LiveSubscriber[];
  onRemove?: (email: string) => void;
  onShowToast?: (msg: string) => void;
}> = ({ isDarkMode, subscribers, onRemove, onShowToast }) => {
  const [subscriberSearch, setSubscriberSearch] = useState('');

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(subscriberSearch.toLowerCase())
  );

  return (
    <div className={`p-6 rounded-[22px] border ${
      isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Newsletter Subscribers
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">People who opted in to store updates</p>
        </div>
        <button
          onClick={() => onShowToast?.('Exporting subscriber list...')}
          className="px-4 py-2 rounded-xl bg-[#98e4af] text-gray-950 text-xs font-bold hover:bg-[#88deb3] cursor-pointer active:scale-98"
        >
          Export List ({subscribers.length})
        </button>
      </div>

      <div className="pb-5 mb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={subscriberSearch}
            onChange={(e) => setSubscriberSearch(e.target.value)}
            placeholder="Search by email..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all ${
              isDarkMode
                ? 'bg-[#272a2e] text-gray-100 focus:ring-1 focus:ring-[#98e4af]'
                : 'bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]'
            }`}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          No subscribers yet — newsletter signups from the site will appear here.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <div
              key={sub.email}
              className={`p-4 rounded-xl flex items-center justify-between border transition-all ${
                isDarkMode ? 'bg-[#272a2e] border-gray-800' : 'bg-[#F9FAFB] border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-[#1e2022] text-[#98e4af]' : 'bg-[#98e4af]/20 text-gray-900'}`}>
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{sub.email}</h4>
                  <p className="text-xs text-gray-400">
                    via {sub.source} · {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#98e4af]/20 text-gray-900 dark:text-[#98e4af]">
                  Subscribed
                </span>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(sub.email)}
                    title="Remove subscriber"
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-[#32363b] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
