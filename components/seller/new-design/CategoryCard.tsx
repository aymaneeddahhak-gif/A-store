"use client"

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CategoryOption {
  id: string;
  label: string;
}

interface CategoryCardProps {
  category: string;
  onCategoryChange: (cat: string) => void;
  categories: CategoryOption[];
  onAddCategory: (newCat: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
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
    <div className="p-6 sm:p-7 rounded-[22px] bg-white border border-gray-100/90">
      <h3 className="text-[17px] font-bold tracking-tight mb-4 text-gray-900">Category</h3>
      <div className="space-y-4">
        <div className="relative">
          <label className="block text-[13px] font-semibold mb-2 text-gray-800">Product Category</label>
          <div onClick={() => setShowDropdown(!showDropdown)} className="w-full px-4 py-3 rounded-xl text-sm flex items-center justify-between cursor-pointer select-none bg-[#F3F4F6] text-gray-800 hover:bg-gray-200/80">
            <span className="truncate">{categories.find((c) => c.id === category)?.label ?? category}</span>
            <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 ml-2 bg-gray-800 text-white"><ChevronDown className="w-2.5 h-2.5" /></div>
          </div>
          {showDropdown && (
            <div className="absolute left-0 right-0 mt-1.5 py-1.5 rounded-xl shadow-lg border z-50 bg-white border-gray-200 text-gray-800 max-h-56 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} onClick={() => { onCategoryChange(cat.id); setShowDropdown(false); }} className={`px-4 py-2 text-xs font-medium cursor-pointer hover:bg-[#98e4af]/20 ${category === cat.id ? 'font-bold text-emerald-600' : ''}`}>{cat.label}</div>
              ))}
            </div>
          )}
        </div>
        {isAddingNew ? (
          <form onSubmit={handleCreateCategory} className="pt-1 flex gap-2">
            <input type="text" autoFocus value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} placeholder="New category..." className="flex-1 px-3 py-2 rounded-xl text-xs outline-none bg-[#F3F4F6] text-gray-800 border border-gray-300" />
            <button type="submit" className="px-3 py-2 bg-[#98e4af] text-gray-950 rounded-xl text-xs font-bold hover:bg-[#88deb3]">Save</button>
            <button type="button" onClick={() => setIsAddingNew(false)} className="px-2.5 py-2 text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
          </form>
        ) : (
          <button type="button" onClick={() => setIsAddingNew(true)} className="px-5 py-2.5 rounded-xl bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 text-xs font-bold cursor-pointer">Add Category</button>
        )}
      </div>
    </div>
  );
};
