"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Package,
  Archive,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Pin,
} from 'lucide-react';
import { ProductItem } from './types';

interface ProductsListViewProps {
  isDarkMode?: boolean;
  products: ProductItem[];
  initialView?: 'catalog' | 'inventory';
  onOpenAddProduct: () => void;
  onEditProduct: (product: ProductItem) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleFeatured?: (productId: string, featured: boolean) => void;
  canFeature?: boolean;
  onResetDemo?: () => void;
  isResettingDemo?: boolean;
  onUpdateStock?: (
    productId: string,
    newStock: string,
    newStatus?: 'In Stock' | 'Low Stock' | 'Out of Stock'
  ) => void;
  onShowToast: (msg: string) => void;
}

export const ProductsListView: React.FC<ProductsListViewProps> = ({
  isDarkMode = false,
  products,
  initialView = 'catalog',
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleFeatured,
  canFeature = false,
  onResetDemo,
  isResettingDemo = false,
  onUpdateStock,
  onShowToast,
}) => {
  const [activeSection, setActiveSection] = useState<'catalog' | 'inventory'>(initialView);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Live categories from real rows (same pills, dynamic options).
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const stockStatuses = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

  const totalStockUnits = products.reduce((acc, p) => acc + (parseInt(p.stock, 10) || 0), 0);
  const lowStockCount = products.filter((p) => p.status === 'Low Stock').length;
  const inStockCount = products.filter((p) => p.status === 'In Stock').length;

  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'All' || prod.category === selectedCategory;

    const matchesStatus =
      selectedStockStatus === 'All' || prod.status === selectedStockStatus;

    const matchesSearch =
      prod.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (prod.sku && prod.sku.toLowerCase().includes(searchFilter.toLowerCase())) ||
      prod.category.toLowerCase().includes(searchFilter.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleStockAdjustment = (prod: ProductItem, delta: number) => {
    const current = parseInt(prod.stock, 10) || 0;
    const nextVal = Math.max(0, current + delta);
    const nextStatus =
      nextVal === 0 ? 'Out of Stock' : nextVal < 20 ? 'Low Stock' : 'In Stock';

    if (onUpdateStock) {
      onUpdateStock(prod.id, nextVal.toString(), nextStatus);
    }
    onShowToast(`Stock for "${prod.name}" updated to ${nextVal} units`);
  };

  const handleQuickRestock = (prod: ProductItem, amount = 50) => {
    handleStockAdjustment(prod, amount);
  };

  return (
    <div id="products-catalog-page" className="space-y-6">
      <div
        id="products-header-bar"
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-[#272a2e] text-[#98e4af]' : 'bg-[#98e4af]/20 text-gray-900'
              }`}
            >
              {activeSection === 'catalog' ? (
                <Package className="w-4 h-4 stroke-[2.4]" />
              ) : (
                <Archive className="w-4 h-4 stroke-[2.4]" />
              )}
            </div>
            <div>
              <h2
                className={`text-[22px] font-bold tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {activeSection === 'catalog' ? 'Products Catalog' : 'Warehouse Inventory'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="tab-all-products"
              onClick={() => setActiveSection('catalog')}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer active:scale-98 ${
                activeSection === 'catalog'
                  ? 'bg-[#98e4af] border-[#98e4af] text-gray-950 font-bold'
                  : isDarkMode
                  ? 'bg-[#1e2022] border-gray-800 text-gray-400 hover:text-white'
                  : 'bg-white border-gray-200/80 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>All Products</span>
            </button>

            <button
              type="button"
              id="tab-inventory"
              onClick={() => setActiveSection('inventory')}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer active:scale-98 ${
                activeSection === 'inventory'
                  ? 'bg-[#98e4af] border-[#98e4af] text-gray-950 font-bold'
                  : isDarkMode
                  ? 'bg-[#1e2022] border-gray-800 text-gray-400 hover:text-white'
                  : 'bg-white border-gray-200/80 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Inventory & Stock</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeSection === 'inventory' && (
            <button
              type="button"
              onClick={() => onShowToast('Warehouse inventory sync initiated...')}
              className={`h-10 px-4 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer active:scale-98 ${
                isDarkMode
                  ? 'bg-[#212427] border-gray-700 text-gray-200 hover:bg-[#98e4af] hover:text-gray-950 hover:border-[#98e4af]'
                  : 'bg-white border-gray-300/80 text-gray-700 hover:bg-[#98e4af] hover:text-gray-950 hover:border-[#98e4af]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Stock</span>
            </button>
          )}

          {onResetDemo && (
            <button
              id="btn-reset-demo"
              type="button"
              onClick={onResetDemo}
              disabled={isResettingDemo}
              className={`h-10 px-4 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 active:scale-98 ${
                isDarkMode
                  ? 'bg-[#212427] border-gray-700 text-gray-200 hover:bg-[#272a2e]'
                  : 'bg-white border-gray-300/80 text-gray-700 hover:bg-gray-50'
              }`}
              title="Restore the 3 starter demo products"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResettingDemo ? 'animate-spin' : ''}`} />
              <span>{isResettingDemo ? 'Resetting…' : 'Reset Demo'}</span>
            </button>
          )}

          <button
            id="btn-add-product"
            type="button"
            onClick={onOpenAddProduct}
            className="h-10 px-5 rounded-xl bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 flex items-center gap-2 text-sm font-bold transition-all shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {activeSection === 'inventory' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-2xl border ${
              isDarkMode
                ? 'bg-[#1e2022] border-gray-800'
                : 'bg-white border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Total Units</span>
              <Boxes className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-[#98e4af]">
              {totalStockUnits.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Across all product lines</p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDarkMode
                ? 'bg-[#1e2022] border-gray-800'
                : 'bg-white border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Active SKUs</span>
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <p className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {products.length}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Ready for fulfillment</p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDarkMode
                ? 'bg-[#1e2022] border-gray-800'
                : 'bg-white border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Low Stock Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-amber-500">
              {lowStockCount}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Under 20 units remaining</p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDarkMode
                ? 'bg-[#1e2022] border-gray-800'
                : 'bg-white border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Healthy Stock</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-[#98e4af]">
              {inStockCount}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Well stocked inventory</p>
          </div>
        </div>
      )}

      <div
        className={`p-4 sm:p-5 rounded-[22px] border flex flex-col gap-3.5 transition-all ${
          isDarkMode
            ? 'bg-[#1e2022] border-gray-800 shadow-sm'
            : 'bg-white border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Category Filter</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-98 ${
                    selectedCategory === cat
                      ? 'bg-[#98e4af] text-gray-950 font-bold shadow-2xs'
                      : isDarkMode
                      ? 'bg-[#272a2e] text-gray-300 hover:bg-[#32363b]'
                      : 'bg-[#F3F4F6] text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search products, SKU, category..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#272a2e] text-gray-100 focus:ring-1 focus:ring-[#98e4af]'
                    : 'bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]'
                }`}
              />
            </div>

            {activeSection === 'catalog' && (
              <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#98e4af] text-gray-950'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#98e4af] text-gray-950'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Table view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
            Stock Status:
          </span>
          {stockStatuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStockStatus(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-98 ${
                selectedStockStatus === st
                  ? 'bg-[#98e4af] text-gray-950 font-bold shadow-2xs'
                  : isDarkMode
                  ? 'bg-[#272a2e] text-gray-300 hover:bg-[#32363b]'
                  : 'bg-[#F3F4F6] text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}

          {(selectedCategory !== 'All' || selectedStockStatus !== 'All' || searchFilter) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedStockStatus('All');
                setSearchFilter('');
              }}
              className="text-[11px] font-semibold text-gray-400 hover:text-rose-500 ml-auto cursor-pointer transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div
          className={`p-12 text-center rounded-[22px] border ${
            isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100'
          }`}
        >
          <Package className="w-10 h-10 text-gray-400 mx-auto mb-3 stroke-[1.5]" />
          <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No products found matching filters
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your category or stock filter, or add a new product to your inventory.
          </p>
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="mt-4 px-4 py-2 rounded-xl bg-[#98e4af] text-gray-950 text-xs font-bold hover:bg-[#88deb3] transition-colors cursor-pointer"
          >
            Add New Product
          </button>
        </div>
      ) : activeSection === 'inventory' ? (
        <div
          className={`rounded-[22px] border overflow-hidden transition-all ${
            isDarkMode
              ? 'bg-[#1e2022] border-gray-800 shadow-sm'
              : 'bg-white border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Item & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4">Available Units</th>
                  <th className="py-3.5 px-4 text-center">Quick Stock Adjust</th>
                  <th className="py-3.5 px-4 text-right">Restock Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {filteredProducts.map((prod) => {
                  const stockNum = parseInt(prod.stock, 10) || 0;
                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-[#25282c] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center overflow-hidden">
                            <Image
                              src={prod.images[0]}
                              alt={prod.name}
                              width={44}
                              height={44}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {prod.name}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono">
                              SKU: {prod.sku || prod.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-medium">
                        {prod.category}
                      </td>

                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-[#98e4af]">
                        {prod.price}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block ${
                            prod.status === 'In Stock'
                              ? 'bg-[#98e4af]/25 text-gray-900 dark:text-[#98e4af]'
                              : prod.status === 'Low Stock'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                          }`}
                        >
                          {prod.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-base font-extrabold ${
                            stockNum < 20 ? 'text-amber-500' : isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {stockNum}
                          </span>
                          <span className="text-gray-400 text-[11px]">units</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-[#272a2e] p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleStockAdjustment(prod, -5)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-[#1e2022] text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition cursor-pointer"
                            title="Decrease by 5 units"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockAdjustment(prod, -1)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-[#1e2022] text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition cursor-pointer"
                            title="Decrease by 1 unit"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockAdjustment(prod, 1)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-[#1e2022] text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition cursor-pointer"
                            title="Increase by 1 unit"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockAdjustment(prod, 10)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-[#1e2022] text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition cursor-pointer"
                            title="Increase by 10 units"
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(prod, 50)}
                            className="px-3 py-1.5 rounded-lg bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 text-xs font-bold transition shadow-2xs active:scale-98 cursor-pointer"
                          >
                            +50 Restock
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProduct(prod)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className={`p-4 rounded-[22px] transition-all border flex flex-col justify-between group ${
                isDarkMode
                  ? 'bg-[#1e2022] border-gray-800 hover:border-gray-700 shadow-sm'
                  : 'bg-white border-gray-100/90 hover:border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
              }`}
            >
              <div>
                <div className="w-full aspect-4/3 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center relative">
                  <Image
                    src={prod.images[0] || prod.images[1]}
                    alt={prod.name}
                    width={320}
                    height={240}
                    unoptimized
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {prod.featured && (
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#1e2022] text-[#98e4af] flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5 stroke-[2.4]" />
                      On top
                    </span>
                  )}
                  <span
                    className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      prod.status === 'In Stock'
                        ? 'bg-[#98e4af] text-gray-950'
                        : prod.status === 'Low Stock'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {prod.status}
                  </span>
                </div>

                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-mono">{prod.sku || prod.id}</span>
                    <span>{prod.category}</span>
                  </div>
                  <h3
                    className={`text-[15px] font-bold mt-1 tracking-tight truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {prod.name}
                  </h3>

                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-base font-extrabold text-emerald-600 dark:text-[#98e4af]">
                      {prod.price}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                      {prod.stock} in stock
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                    {prod.sizes?.slice(0, 4).map((sz) => (
                      <span
                        key={sz}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          isDarkMode
                            ? 'bg-[#272a2e] text-gray-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {sz}
                      </span>
                    ))}
                    {prod.colors?.slice(0, 3).map((clr) => (
                      <span
                        key={clr}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          isDarkMode
                            ? 'bg-[#272a2e] text-gray-400'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {clr}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onToggleFeatured?.(prod.id, !prod.featured)}
                  disabled={!canFeature}
                  className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-colors ${
                    prod.featured
                      ? 'bg-[#98e4af] border-[#98e4af] text-gray-950'
                      : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  } ${canFeature ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                  title={
                    canFeature
                      ? prod.featured
                        ? 'Remove from the homepage showcase'
                        : 'Show on top of the homepage'
                      : 'Only the store admin can change the homepage showcase.'
                  }
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onEditProduct(prod)}
                  className="h-8 flex-1 rounded-xl bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <Edit2 className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteProduct(prod.id)}
                  className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-rose-500 hover:border-rose-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Delete product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`rounded-[22px] border overflow-hidden transition-all ${
            isDarkMode
              ? 'bg-[#1e2022] border-gray-800 shadow-sm'
              : 'bg-white border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Sizes & Colors</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {filteredProducts.map((prod) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-[#25282c] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center overflow-hidden">
                          <Image
                            src={prod.images[0]}
                            alt={prod.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-gray-400">{prod.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-medium">
                      {prod.category}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                      {prod.sku || prod.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-[#98e4af]">
                      {prod.price}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">
                      {prod.stock} Pcs
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 flex-wrap max-w-xs">
                        {prod.sizes?.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#272a2e] text-[10px] font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                        {prod.colors?.slice(0, 2).map((c) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#272a2e] text-[10px] text-gray-500"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          prod.status === 'In Stock'
                            ? 'bg-[#98e4af] text-gray-950'
                            : prod.status === 'Low Stock'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {prod.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleFeatured?.(prod.id, !prod.featured)}
                          disabled={!canFeature}
                          className={`p-1.5 rounded-lg transition-colors ${
                            prod.featured
                              ? 'bg-[#98e4af] text-gray-950'
                              : 'text-gray-400 hover:text-gray-700'
                          } ${canFeature ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                          title={
                            canFeature
                              ? prod.featured
                                ? 'Showing on top'
                                : 'Show on top of the homepage'
                              : 'Only the store admin can change the homepage showcase.'
                          }
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditProduct(prod)}
                          className="h-7 px-3 rounded-lg bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-98"
                        >
                          <Edit2 className="w-3 h-3 stroke-[2.2]" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
