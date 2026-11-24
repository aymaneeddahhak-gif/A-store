"use client"

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface PricingStockCardProps {
  isDarkMode?: boolean;
  basePrice: string;
  onBasePriceChange: (val: string) => void;
  stock: string;
  onStockChange: (val: string) => void;
  discount: string;
  onDiscountChange: (val: string) => void;
  discountType: string;
  onDiscountTypeChange: (val: string) => void;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  onStockStatusChange: (status: 'In Stock' | 'Low Stock' | 'Out of Stock') => void;
}

export const PricingStockCard: React.FC<PricingStockCardProps> = ({
  isDarkMode = false,
  basePrice,
  onBasePriceChange,
  stock,
  onStockChange,
  discount,
  onDiscountChange,
  discountType,
  onDiscountTypeChange,
  stockStatus,
  onStockStatusChange,
}) => {
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);
  const discountOptions = ['Member Exclusive', 'Seasonal Promotion', 'Clearance Discount', 'Chinese New Year Discount', 'Black Friday Sale'];
  const statusOptions: Array<'In Stock' | 'Low Stock' | 'Out of Stock'> = ['In Stock', 'Low Stock', 'Out of Stock'];

  const inputCls = isDarkMode
    ? 'w-full px-4 py-3 rounded-xl text-sm outline-none bg-[#272a2e] text-gray-100 focus:ring-1 focus:ring-[#98e4af]'
    : 'w-full px-4 py-3 rounded-xl text-sm outline-none bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]';
  const labelCls = `block text-[13px] font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`;

  return (
    <div id="card-pricing-and-stock" className={`p-6 sm:p-7 rounded-[22px] border transition-colors ${isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100/90'}`}>
      <h3 className={`text-[17px] font-bold tracking-tight mb-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pricing And Stock</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div>
          <label htmlFor="input-base-pricing" className={labelCls}>Base Pricing</label>
          <input id="input-base-pricing" type="text" value={basePrice} onChange={(e) => onBasePriceChange(e.target.value)} placeholder="$0.00" className={inputCls} />
        </div>
        <div>
          <label htmlFor="input-stock" className={labelCls}>Stock Units</label>
          <input id="input-stock" type="text" value={stock} onChange={(e) => { const val = e.target.value; onStockChange(val); const num = parseInt(val, 10); if (!isNaN(num)) { if (num === 0) onStockStatusChange('Out of Stock'); else if (num < 20) onStockStatusChange('Low Stock'); else onStockStatusChange('In Stock'); } }} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label htmlFor="input-discount" className={labelCls}>Discount</label>
          <input id="input-discount" type="text" value={discount} onChange={(e) => onDiscountChange(e.target.value)} placeholder="0%" className={inputCls} />
        </div>
        <div className="relative">
          <label className={labelCls}>Discount Type</label>
          <div onClick={() => setShowDiscountDropdown(!showDiscountDropdown)} className={`w-full px-4 py-3 rounded-xl text-sm flex items-center justify-between cursor-pointer select-none ${isDarkMode ? 'bg-[#272a2e] text-gray-100 hover:bg-[#32363b]' : 'bg-[#F3F4F6] text-gray-800 hover:bg-gray-200/80'}`}>
            <span className="truncate">{discountType}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
          </div>
          {showDiscountDropdown && (
            <div className={`absolute left-0 right-0 mt-1.5 py-1.5 rounded-xl shadow-lg border z-50 ${isDarkMode ? 'bg-[#25282c] border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
              {discountOptions.map((opt) => (
                <div key={opt} onClick={() => { onDiscountTypeChange(opt); setShowDiscountDropdown(false); }} className={`px-4 py-2 text-xs font-medium cursor-pointer hover:bg-[#98e4af]/20 ${discountType === opt ? 'font-bold text-emerald-500' : ''}`}>{opt}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={`pt-4 mt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <label className={labelCls}>Inventory Status</label>
        <div className="flex items-center gap-3 flex-wrap">
          {statusOptions.map((st) => {
            const isSelected = stockStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => onStockStatusChange(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? st === 'In Stock'
                      ? 'bg-[#98e4af] text-gray-950 font-bold'
                      : st === 'Low Stock'
                      ? 'bg-amber-100 text-amber-800 font-bold ring-1 ring-amber-400 dark:bg-amber-950/50 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 font-bold ring-1 ring-rose-400 dark:bg-rose-950/50 dark:text-rose-300'
                    : isDarkMode
                    ? 'bg-[#272a2e] text-gray-300 hover:bg-[#32363b]'
                    : 'bg-[#F3F4F6] text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
