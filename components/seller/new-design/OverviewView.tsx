"use client"

import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  Package,
} from 'lucide-react';

export interface OverviewKpi {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  period: string;
}

export interface OverviewBar {
  label: string;
  revenue: number;
  height: number;
  orders: number;
}

export interface OverviewTopProduct {
  id: string;
  name: string;
  pieces: string;
  image: string;
}

export interface OverviewRecentOrder {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: string;
}

export interface OverviewCategoryShare {
  name: string;
  share: number;
  amount: string;
}

interface OverviewViewProps {
  isDarkMode?: boolean;
  kpis: OverviewKpi[];
  weeklyData: OverviewBar[];
  monthlyData: OverviewBar[];
  topProducts: OverviewTopProduct[];
  recentOrders: OverviewRecentOrder[];
  categoryShare: OverviewCategoryShare[];
  categoryTotal: string;
  avgRevenueLabel: string;
  growthLabel: string;
  onNavigateToAddProduct: () => void;
  onExportReport: () => void;
}

const KPI_ICONS = [DollarSign, ShoppingCart, Package, Users];

export const OverviewView: React.FC<OverviewViewProps> = ({
  isDarkMode = false,
  kpis,
  weeklyData,
  monthlyData,
  topProducts,
  recentOrders,
  categoryShare,
  categoryTotal,
  avgRevenueLabel,
  growthLabel,
  onNavigateToAddProduct,
}) => {
  const [timeframe, setTimeframe] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const currentChartData = timeframe === 'Weekly' ? weeklyData : monthlyData;

  return (
    <div id="salessync-overview" className="space-y-6">
      {/* 1. TOP KPI METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {kpis.map((kpi, i) => {
          const IconComp = KPI_ICONS[i % KPI_ICONS.length];
          return (
            <div
              key={kpi.id}
              id={kpi.id}
              className={`p-6 rounded-[22px] transition-all border ${
                isDarkMode
                  ? 'bg-[#1e2022] border-gray-800 shadow-sm'
                  : 'bg-white border-gray-100/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400">
                  {kpi.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isDarkMode
                      ? 'bg-[#272a2e] text-[#98e4af]'
                      : 'bg-[#98e4af]/15 text-[#1e2022]'
                  }`}
                >
                  <IconComp className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-3xl font-bold tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {kpi.value}
                </span>
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-[#98e4af]/20 text-[#1e2022] dark:text-[#98e4af]">
                  {kpi.change}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 font-normal">
                {kpi.period}
              </p>
            </div>
          );
        })}
      </div>

      {/* 2. SALES ANALYTICS & CATEGORY SHARE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div
          id="card-sales-analytics"
          className={`lg:col-span-8 p-6 sm:p-7 rounded-[22px] transition-all border ${
            isDarkMode
              ? 'bg-[#1e2022] border-gray-800 shadow-sm'
              : 'bg-white border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2
                className={`text-[22px] font-bold tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                Sales Analytics
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Revenue and order volume trends
              </p>
            </div>

            <div
              className={`inline-flex p-1 rounded-xl ${
                isDarkMode ? 'bg-[#272a2e]' : 'bg-[#F3F4F6]'
              }`}
            >
              {(['Weekly', 'Monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    timeframe === period
                      ? 'bg-[#98e4af] text-gray-950 font-bold shadow-2xs'
                      : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-gray-100 dark:border-gray-800 relative">
            {currentChartData.map((item, idx) => {
              const isHovered = hoveredBarIndex === idx;
              return (
                <div
                  key={item.label}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {isHovered && (
                    <div
                      className={`absolute -top-11 z-20 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md whitespace-nowrap animate-fade-in ${
                        isDarkMode
                          ? 'bg-gray-800 text-[#98e4af]'
                          : 'bg-gray-900 text-white'
                      }`}
                    >
                      ${item.revenue.toLocaleString()}
                    </div>
                  )}

                  <div className="w-full max-w-[36px] bg-gray-100 dark:bg-[#272a2e] rounded-t-lg h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-[#98e4af] rounded-t-lg transition-all duration-300 group-hover:brightness-95"
                      style={{ height: `${item.height}%` }}
                    />
                  </div>

                  <span className="text-xs font-semibold text-gray-400 mt-3">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-3">
            <span>{avgRevenueLabel}</span>
            <span className="text-[#1e2022] dark:text-[#98e4af] font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {growthLabel}
            </span>
          </div>
        </div>

        <div
          id="card-category-share"
          className={`lg:col-span-4 p-6 sm:p-7 rounded-[22px] transition-all border flex flex-col justify-between ${
            isDarkMode
              ? 'bg-[#1e2022] border-gray-800 shadow-sm'
              : 'bg-white border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          }`}
        >
          <div>
            <h2
              className={`text-[22px] font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Category Share
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Current sales distribution
            </p>

            <div className="mt-6 space-y-4">
              {categoryShare.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {cat.name}
                    </span>
                    <span className="text-gray-400 font-semibold">{cat.share}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#272a2e] overflow-hidden">
                    <div
                      className="h-full bg-[#98e4af] rounded-full transition-all duration-500"
                      style={{ width: `${cat.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex items-center justify-between">
            <span>Total Categories: {categoryShare.length}</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{categoryTotal} total</span>
          </div>
        </div>
      </div>

      {/* 3. TOP SELLING PRODUCTS & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div
          id="card-top-selling-products"
          className={`lg:col-span-8 p-6 sm:p-7 rounded-[22px] transition-all border ${
            isDarkMode
              ? 'bg-[#1e2022] border-gray-800 shadow-sm'
              : 'bg-white border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className={`text-[22px] font-bold tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                Top Selling Products
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Highest selling inventory this month
              </p>
            </div>

            <button
              onClick={onNavigateToAddProduct}
              className="text-xs font-bold text-gray-800 dark:text-gray-200 hover:text-[#98e4af] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Manage Products</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No products yet — add your first product.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto pb-1">
              {topProducts.map((sneaker) => (
                <div
                  key={sneaker.id}
                  onClick={onNavigateToAddProduct}
                  className={`p-2 rounded-2xl transition-all cursor-pointer group flex flex-col ${
                    isDarkMode
                      ? 'bg-[#272a2e]/40 hover:bg-[#272a2e]'
                      : 'bg-white hover:bg-gray-50/70'
                  }`}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center relative group-hover:scale-102 transition-transform duration-200 bg-gray-100 dark:bg-gray-800">
                    <img
                      src={sneaker.image}
                      alt={sneaker.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="mt-2.5 px-0.5">
                    <h4
                      className={`text-[13px] font-bold tracking-tight truncate leading-snug ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {sneaker.name}
                    </h4>
                    <p className="text-[12px] text-gray-400 font-normal mt-0.5">
                      {sneaker.pieces}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          id="card-recent-orders"
          className={`lg:col-span-4 p-6 sm:p-7 rounded-[22px] transition-all border ${
            isDarkMode
              ? 'bg-[#1e2022] border-gray-800 shadow-sm'
              : 'bg-white border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-[22px] font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Recent Orders
            </h2>
            <span className="text-xs font-semibold text-gray-400">Live</span>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-3.5">
              {recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 dark:border-gray-800/60 last:border-none"
                >
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {ord.customer}
                    </p>
                    <p className="text-gray-400 text-[11px]">{ord.product}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {ord.amount}
                    </p>
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#98e4af]/20 text-[#1e2022] dark:text-[#98e4af]">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
