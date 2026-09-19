"use client"

import React, { useState } from 'react';
import { Search } from 'lucide-react';

export interface LiveMetric {
  title: string;
  val: string;
  change: string;
  note: string;
}

export interface LiveChannel {
  name: string;
  visitors: string;
  sales: string;
  pct: number;
}

export interface LiveCustomer {
  name: string;
  email: string;
  orders: number;
  total: string;
  tier: string;
}

// 1. ANALYTICS VIEW — design shell, live metrics via props.
export const AnalyticsView: React.FC<{
  isDarkMode?: boolean;
  metrics: LiveMetric[];
  channels: LiveChannel[];
  onShowToast?: (msg: string) => void;
}> = ({ isDarkMode, metrics, channels, onShowToast }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.title}
            className={`p-5 rounded-[22px] border ${
              isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100 shadow-sm'
            }`}
          >
            <p className="text-xs text-gray-400 font-semibold">{m.title}</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {m.val}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#98e4af]/20 text-[#1e2022] dark:text-[#98e4af]">
                {m.change}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">{m.note}</p>
          </div>
        ))}
      </div>

      <div className={`p-6 rounded-[22px] border ${
        isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Top Categories by Revenue
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Live revenue share from your orders</p>
          </div>
          <button
            onClick={() => onShowToast?.('Exporting analytics report...')}
            className="px-3.5 py-1.5 rounded-xl bg-[#98e4af] text-gray-950 font-bold text-xs cursor-pointer hover:bg-[#88deb3] transition-colors"
          >
            Export Report
          </button>
        </div>

        {channels.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No sales data yet.</p>
        ) : (
          <div className="space-y-4">
            {channels.map((ch) => (
              <div key={ch.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{ch.name}</span>
                  <span className="text-gray-400">{ch.sales} ({ch.pct}%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-[#272a2e] overflow-hidden">
                  <div
                    className="h-full bg-[#98e4af] rounded-full"
                    style={{ width: `${ch.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 2. CUSTOMERS VIEW — design shell, live rows via props.
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
        <div className="py-10 text-center text-xs text-gray-400">
          No customers found{customers.length > 0 ? ` matching "${customerFilter}"` : ' yet — customers appear here after their first order'}.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((cust, idx) => (
            <div
              key={`${cust.email}-${idx}`}
              className={`p-4 rounded-xl flex items-center justify-between border transition-all ${
                isDarkMode ? 'bg-[#272a2e] border-gray-800' : 'bg-[#F9FAFB] border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#98e4af]/30 flex items-center justify-center font-bold text-gray-900 dark:text-white text-sm">
                  {cust.name.charAt(0)}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{cust.name}</h4>
                  <p className="text-xs text-gray-400">{cust.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="block text-xs font-bold">{cust.orders} orders</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-[#98e4af]">{cust.total} spent</span>
                </div>
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#98e4af]/20 text-gray-900 dark:text-[#98e4af]">
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

// 3. SETTINGS VIEW — design shell, neutral store defaults.
export const SettingsView: React.FC<{
  isDarkMode?: boolean;
  storeName?: string;
  notificationEmail?: string;
  onShowToast?: (msg: string) => void;
}> = ({ isDarkMode, storeName = 'A-store', notificationEmail = '', onShowToast }) => {
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

      <div className="space-y-5 max-w-xl">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Store Name</label>
          <input
            type="text"
            defaultValue={storeName}
            className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${
              isDarkMode ? 'bg-[#272a2e] border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Primary Currency</label>
          <select
            defaultValue="USD"
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
            defaultValue={notificationEmail}
            placeholder="you@store.com"
            className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${
              isDarkMode ? 'bg-[#272a2e] border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
            }`}
          />
        </div>

        <button
          onClick={() => onShowToast?.('Settings saved successfully')}
          className="px-5 py-2.5 rounded-xl bg-[#98e4af] text-gray-950 font-bold text-xs hover:bg-[#88deb3] cursor-pointer shadow-xs"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
