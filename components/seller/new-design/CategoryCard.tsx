"use client"

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CategoryOption {
  id: string;
  label: string;
}

interface CategoryCardProps {
  isDarkMode?: boolean;
  category: string;
  onCategoryChange: (cat: string) => void;
  categories: CategoryOption[];
  onAddCategory: (newCat: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  isDarkMode = false,
  category,
  onCategoryChange,
  categories,
  onAddCategory,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatInput.trim()) {
      onAddCategory(newCatInput.trim());
      setNewCatInput('');
      setIsAddingNew(false);
    }
  };

  return (
    <div className={`p-6 sm:p-7 rounded-[22px] border transition-colors ${isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100/90'}`}>
      <h3 className={`text-[17px] font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Category</h3>
      <div className="space-y-4">
        <div className="relative">
          <label className={`block text-[13px] font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Product Category</label>
          <div onClick={() => setShowDropdown(!showDropdown)} className={`w-full px-4 py-3 rounded-xl text-sm flex items-center justify-between cursor-pointer select-none ${isDarkMode ? 'bg-[#272a2e] text-gray-100 hover:bg-[#32363b]' : 'bg-[#F3F4F6] text-gray-800 hover:bg-gray-200/80'}`}>
            <span className="truncate">{categories.find((c) => c.id === category)?.label ?? category}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
          </div>
          {showDropdown && (
            <div className={`absolute left-0 right-0 mt-1.5 py-1.5 rounded-xl shadow-lg border z-50 max-h-56 overflow-y-auto ${isDarkMode ? 'bg-[#25282c] border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
              {categories.map((cat) => (
                <div key={cat.id} onClick={() => { onCategoryChange(cat.id); setShowDropdown(false); }} className={`px-4 py-2 text-xs font-medium cursor-pointer hover:bg-[#98e4af]/20 ${category === cat.id ? 'font-bold text-emerald-500' : ''}`}>{cat.label}</div>
              ))}
            </div>
          )}
        </div>
        {isAddingNew ? (
          <form onSubmit={handleCreateCategory} className="pt-1 flex gap-2">
            <input type="text" autoFocus value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} placeholder="New category..." className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none border ${isDarkMode ? 'bg-[#272a2e] text-white border-gray-700' : 'bg-[#F3F4F6] text-gray-800 border-gray-300'}`} />
            <button type="submit" className="px-3 py-2 bg-[#98e4af] text-gray-950 rounded-xl text-xs font-bold hover:bg-[#88deb3] cursor-pointer">Save</button>
            <button type="button" onClick={() => setIsAddingNew(false)} className="px-2.5 py-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer">Cancel</button>
          </form>
        ) : (
          <button type="button" onClick={() => setIsAddingNew(true)} className="px-5 py-2.5 rounded-xl bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 text-xs font-bold cursor-pointer">Add Category</button>
        )}
      </div>
    </div>
  );
};
