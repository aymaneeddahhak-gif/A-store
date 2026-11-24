"use client"

import React from 'react';
import { Check, Save, ArrowLeft, CopyPlus } from 'lucide-react';

interface PageHeaderProps {
  isDarkMode?: boolean;
  isEditMode?: boolean;
  onBack?: () => void;
  onSaveDraft: () => void;
  onAddProduct: () => void;
  isSubmitting?: boolean;
  /** One-click demo data fill (Add mode only). */
  onFillDemo?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  isDarkMode = false,
  isEditMode = false,
  onBack,
  onSaveDraft,
  onAddProduct,
  isSubmitting = false,
  onFillDemo,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`h-10 px-4 rounded-xl border flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#1e2022] border-gray-800 text-gray-200 hover:bg-[#272a2e]'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            title="Back to products list"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {onFillDemo && !isEditMode && (
          <button
            type="button"
            onClick={onFillDemo}
            className={`h-10 px-5 rounded-xl border flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#1e2022] border-gray-800 text-gray-200 hover:bg-[#272a2e]'
                : 'bg-white border-gray-300/80 text-gray-700 hover:bg-gray-50'
            }`}
            title="Fill every field with sample data so you can try the flow instantly"
          >
            <CopyPlus className="w-4 h-4" /><span>Fill demo product</span>
          </button>
        )}
        <button
          type="button"
          onClick={onSaveDraft}
          className={`h-10 px-5 rounded-xl border flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
            isDarkMode
              ? 'bg-[#1e2022] border-gray-800 text-gray-200 hover:bg-[#98e4af] hover:text-gray-950 hover:border-[#98e4af]'
              : 'bg-white border-gray-300/80 text-gray-700 hover:bg-[#98e4af] hover:text-gray-950 hover:border-[#98e4af]'
          }`}
        >
          <Save className="w-4 h-4" /><span>Save Draft</span>
        </button>
        <button
          type="button"
          onClick={onAddProduct}
          disabled={isSubmitting}
          className="h-10 px-5 rounded-xl bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 flex items-center gap-2 text-sm font-bold cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4" /><span>{isSubmitting ? "Saving…" : isEditMode ? 'Save Changes' : 'Add Product'}</span>
        </button>
      </div>
    </div>
  );
};
