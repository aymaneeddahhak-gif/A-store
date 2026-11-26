"use client"

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Check, X, ImagePlus } from 'lucide-react';
import { ColorOption } from './types';

interface GeneralInfoCardProps {
  isDarkMode?: boolean;
  name: string;
  onNameChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  selectedSizes: string[];
  availableSizes: string[];
  onToggleSize: (size: string) => void;
  onAddCustomSize: (size: string) => void;
  selectedColors: string[];
  availableColors: ColorOption[];
  onToggleColor: (colorName: string) => void;
  onAddCustomColor: (color: ColorOption) => void;
  onUpdateColorImage?: (colorName: string, image: string | undefined) => void;
  gender: 'Men' | 'Woman' | 'Unisex';
  onGenderChange: (g: 'Men' | 'Woman' | 'Unisex') => void;
  sku: string;
  onSkuChange: (val: string) => void;
  productType: string;
  onProductTypeChange: (val: string) => void;
}

export const GeneralInfoCard: React.FC<GeneralInfoCardProps> = ({
  isDarkMode = false,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  selectedSizes,
  availableSizes,
  onToggleSize,
  onAddCustomSize,
  selectedColors,
  availableColors,
  onToggleColor,
  onAddCustomColor,
  onUpdateColorImage,
  gender,
  onGenderChange,
  sku,
  onSkuChange,
  productType,
  onProductTypeChange,
}) => {
  const genderOptions: Array<'Men' | 'Woman' | 'Unisex'> = ['Men', 'Woman', 'Unisex'];
  const [isAddingSize, setIsAddingSize] = useState(false);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#6366F1');
  const [newColorImage, setNewColorImage] = useState<string | undefined>(undefined);
  const addColorFileRef = useRef<HTMLInputElement>(null);
  const existingColorFileRef = useRef<HTMLInputElement>(null);
  const pendingColorTargetRef = useRef<string | null>(null);

  const readImageAsDataUrl = (file: File | undefined, done: (url: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') done(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSize = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSizeInput.trim().toUpperCase();
    if (trimmed && !availableSizes.includes(trimmed)) {
      onAddCustomSize(trimmed);
      onToggleSize(trimmed);
      setNewSizeInput('');
      setIsAddingSize(false);
    }
  };

  const handleCreateColor = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newColorName.trim();
    if (trimmed && !availableColors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      const newColor: ColorOption = {
        name: trimmed,
        hex: newColorHex,
        ...(newColorImage ? { image: newColorImage } : {}),
      };
      onAddCustomColor(newColor);
      onToggleColor(trimmed);
      setNewColorName('');
      setNewColorImage(undefined);
      setIsAddingColor(false);
    }
  };

  return (
    <div id="card-general-information" className={`p-6 sm:p-7 rounded-[22px] transition-colors border ${isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100/90'}`}>
      <h3 className={`text-[17px] font-bold tracking-tight mb-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>General Information</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="input-name-product" className={`block text-[13px] font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Name Product</label>
          <input id="input-name-product" type="text" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Product Name" className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all ${isDarkMode ? 'bg-[#272a2e] text-gray-100 focus:ring-1 focus:ring-[#98e4af]' : 'bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]'}`} />
        </div>
        <div>
          <label htmlFor="textarea-description-product" className={`block text-[13px] font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Description Product</label>
          <textarea id="textarea-description-product" rows={3} value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="Product Description" className={`w-full px-4 py-3 rounded-xl text-sm leading-relaxed outline-none resize-none transition-all ${isDarkMode ? 'bg-[#272a2e] text-gray-100 focus:ring-1 focus:ring-[#98e4af]' : 'bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]'}`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="input-sku" className={`block text-[13px] font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>SKU (Product Code)</label>
            <input id="input-sku" type="text" value={sku} onChange={(e) => onSkuChange(e.target.value)} placeholder="e.g. JKT-4091-MNT" className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all ${isDarkMode ? 'bg-[#272a2e] text-gray-100 focus:ring-1 focus:ring-[#98e4af]' : 'bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]'}`} />
          </div>
          <div>
            <label htmlFor="input-product-type" className={`block text-[13px] font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Product Type / Tag</label>
            <input id="input-product-type" type="text" value={productType} onChange={(e) => onProductTypeChange(e.target.value)} placeholder="e.g. Outerwear, Winter, New" className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all ${isDarkMode ? 'bg-[#272a2e] text-gray-100 focus:ring-1 focus:ring-[#98e4af]' : 'bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]'}`} />
          </div>
        </div>
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className={`block text-[13px] font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Size</span>
              <span className="block text-[11px] text-gray-400">Pick Available Size</span>
            </div>
            {!isAddingSize && (
              <button type="button" onClick={() => setIsAddingSize(true)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /><span>Add Size</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {availableSizes.map((size) => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button key={size} type="button" onClick={() => onToggleSize(size)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isSelected ? 'bg-[#98e4af] text-gray-950 font-bold' : isDarkMode ? 'bg-[#272a2e] text-gray-400 hover:bg-[#32363b]' : 'bg-[#F3F4F6] text-gray-600 hover:bg-gray-200'}`}>{size}</button>
              );
            })}
          </div>
          {isAddingSize && (
            <form onSubmit={handleCreateSize} className="mt-2.5 flex items-center gap-2">
              <input type="text" autoFocus value={newSizeInput} onChange={(e) => setNewSizeInput(e.target.value)} placeholder="Enter size (e.g. 3XL, 42)" className={`px-3 py-1.5 rounded-lg text-xs outline-none ${isDarkMode ? 'bg-[#272a2e] text-white focus:ring-1 focus:ring-[#98e4af]' : 'bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]'}`} />
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 text-xs font-bold cursor-pointer">Save</button>
              <button type="button" onClick={() => { setIsAddingSize(false); setNewSizeInput(''); }} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </form>
          )}
        </div>
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className={`block text-[13px] font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Color</span>
              <span className="block text-[11px] text-gray-400">Pick Available Colors</span>
            </div>
            {!isAddingColor && (
              <button type="button" onClick={() => setIsAddingColor(true)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /><span>Add Color</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {availableColors.map((col) => {
              const isSelected = selectedColors.includes(col.name);
              return (
                <button key={col.name} type="button" onClick={() => onToggleColor(col.name)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${isSelected ? 'ring-1 ring-[#98e4af] bg-[#98e4af]/15 font-semibold' : isDarkMode ? 'bg-[#272a2e] text-gray-300 hover:bg-[#32363b]' : 'bg-[#F3F4F6] text-gray-700 hover:bg-gray-200'}`}>
                  {col.image ? (
                    <span className="w-4 h-4 rounded-sm overflow-hidden border border-black/10 shrink-0 relative">
                      <Image src={col.image} alt={col.name} fill sizes="16px" unoptimized className="object-cover" />
                    </span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 flex items-center justify-center" style={{ backgroundColor: col.hex }}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-gray-900" />}
                    </span>
                  )}
                  <span>{col.name}</span>
                </button>
              );
            })}
          </div>
          {isAddingColor && (
            <form onSubmit={handleCreateColor} className="mt-2.5 flex items-center gap-2 flex-wrap">
              <input type="text" autoFocus value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="Color Name (e.g. Navy)" className={`px-3 py-1.5 rounded-lg text-xs outline-none ${isDarkMode ? 'bg-[#272a2e] text-white focus:ring-1 focus:ring-[#98e4af]' : 'bg-[#F3F4F6] text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#98e4af]'}`} />
              <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0.5 bg-transparent" title="Choose Color Hex" />
              <input
                ref={addColorFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  readImageAsDataUrl(e.target.files?.[0], (url) => setNewColorImage(url));
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => addColorFileRef.current?.click()}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border ${isDarkMode ? 'border-gray-700 bg-[#272a2e] text-gray-200 hover:bg-[#32363b]' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                title="Attach product image for this color version"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>{newColorImage ? 'Change Photo' : 'Color Photo'}</span>
              </button>
              {newColorImage && (
                <span className="w-8 h-8 rounded-lg overflow-hidden border border-black/10 relative shrink-0">
                  <Image src={newColorImage} alt="New color preview" fill sizes="32px" unoptimized className="object-cover" />
                </span>
              )}
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 text-xs font-bold cursor-pointer">Save</button>
              <button type="button" onClick={() => { setIsAddingColor(false); setNewColorName(''); setNewColorImage(undefined); }} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </form>
          )}
          {onUpdateColorImage && selectedColors.length > 0 && (
            <div className={`mt-3 pt-3 border-t space-y-2 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <span className="block text-[11px] font-medium text-gray-400">
                Extra Color Version Photos (optional — swaps gallery image when customer picks color)
              </span>
              <input
                ref={existingColorFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const targetName = pendingColorTargetRef.current;
                  readImageAsDataUrl(e.target.files?.[0], (url) => {
                    if (targetName) onUpdateColorImage(targetName, url);
                  });
                  e.target.value = '';
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedColors.map((colorName) => {
                  const col = availableColors.find((c) => c.name === colorName);
                  return (
                    <div
                      key={colorName}
                      className={`flex items-center justify-between gap-2.5 p-2 rounded-xl border ${
                        isDarkMode ? 'bg-[#272a2e] border-gray-700/70' : 'bg-[#F9FAFB] border-gray-200/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {col?.image ? (
                          <div className="w-9 h-9 rounded-lg overflow-hidden relative shrink-0 border border-black/10 bg-white">
                            <Image src={col.image} alt={colorName} fill sizes="36px" unoptimized className="object-cover" />
                          </div>
                        ) : (
                          <span
                            className="w-9 h-9 rounded-lg shrink-0 border border-black/10 flex items-center justify-center"
                            style={{ backgroundColor: col?.hex ?? '#888888' }}
                          />
                        )}
                        <span className={`text-xs font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {colorName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            pendingColorTargetRef.current = colorName;
                            existingColorFileRef.current?.click();
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border ${
                            isDarkMode
                              ? 'border-gray-600 text-gray-200 hover:bg-[#32363b]'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {col?.image ? 'Change' : 'Upload'}
                        </button>
                        {col?.image && (
                          <button
                            type="button"
                            onClick={() => onUpdateColorImage(colorName, undefined)}
                            aria-label={`Remove photo for ${colorName}`}
                            className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="pt-2">
          <div className="mb-2">
            <span className={`block text-[13px] font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Gender</span>
            <span className="block text-[11px] text-gray-400">Pick Available Gender</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap pt-0.5">
            {genderOptions.map((g) => {
              const isSelected = gender === g;
              return (
                <button key={g} type="button" onClick={() => onGenderChange(g)} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${isSelected ? 'border-2 border-[#98e4af]' : 'border-2 border-gray-400'}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#98e4af]" />}
                  </div>
                  <span className={isSelected ? (isDarkMode ? 'font-semibold text-white' : 'font-semibold text-gray-900') : 'text-gray-500'}>{g}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
