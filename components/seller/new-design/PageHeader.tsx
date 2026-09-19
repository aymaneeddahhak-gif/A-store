"use client"

import React from 'react';
import { Check, Save, ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  isEditMode?: boolean;
  onBack?: () => void;
  onSaveDraft: () => void;
  onAddProduct: () => void;
  isSubmitting?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  isEditMode = false,
  onBack,
  onSaveDraft,
  onAddProduct,
  isSubmitting = false,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2.5">
        {onBack && (
          <button type="button" onClick={onBack} className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-200 cursor-pointer mr-1" title="Back to products list">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-xl font-bold tracking-tight text-gray-900">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onSaveDraft} className="h-10 px-5 rounded-xl border bg-white border-gray-300/80 text-gray-700 hover:bg-[#98e4af] hover:text-gray-950 hover:border-[#98e4af] flex items-center gap-2 text-sm font-medium cursor-pointer">
          <Save className="w-4 h-4" /><span>Save Draft</span>
        </button>
        <button type="button" onClick={onAddProduct} disabled={isSubmitting} className="h-10 px-5 rounded-xl bg-[#98e4af] hover:bg-[#88deb3] text-gray-950 flex items-center gap-2 text-sm font-bold cursor-pointer disabled:opacity-50">
          <Check className="w-4 h-4" /><span>{isSubmitting ? "Saving…" : isEditMode ? 'Save Changes' : 'Add Product'}</span>
        </button>
      </div>
    </div>
  );
};
