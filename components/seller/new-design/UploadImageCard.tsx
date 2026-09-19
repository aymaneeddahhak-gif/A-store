"use client"

import React, { useRef } from 'react';
import { Plus, ImagePlus } from 'lucide-react';

interface UploadImageCardProps {
  images: string[];
  activeImageIndex: number;
  onSelectImage: (index: number) => void;
  onAddCustomImage: (dataUrl: string) => void;
}

export const UploadImageCard: React.FC<UploadImageCardProps> = ({
  images,
  activeImageIndex,
  onSelectImage,
  onAddCustomImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) onAddCustomImage(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const openPicker = () => fileInputRef.current?.click();
  const activeSrc = images[Math.min(activeImageIndex, Math.max(0, images.length - 1))];

  return (
    <div id="card-upload-img" className="p-6 sm:p-7 rounded-[22px] bg-white border border-gray-100/90">
      <h3 className="text-[17px] font-bold tracking-tight mb-4 text-gray-900">Upload Img</h3>
      {images.length === 0 ? (
        <button
          type="button"
          onClick={openPicker}
          className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-[#F4F5F7] hover:bg-gray-100 transition-colors py-12 px-6 flex flex-col items-center justify-center gap-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-[#98e4af] flex items-center justify-center text-gray-900">
            <ImagePlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Upload product photos</p>
            <p className="text-xs text-gray-400 mt-1">PNG or JPG — first photo becomes the cover</p>
          </div>
        </button>
      ) : (
        <>
          <div className="w-full rounded-2xl p-4 sm:p-6 mb-4 flex items-center justify-center bg-[#F4F5F7] relative overflow-hidden">
            {activeSrc ? (
              <img src={activeSrc} alt="Product Showcase" className="w-full max-h-72 object-contain" />
            ) : (
              <p className="text-xs text-gray-400">No image yet.</p>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {images.map((imgUrl, idx) => (
              <button key={`${idx}-${imgUrl.slice(0, 24)}`} type="button" onClick={() => onSelectImage(idx)} className={`aspect-square rounded-xl p-1.5 flex items-center justify-center overflow-hidden bg-[#F4F5F7] cursor-pointer ${activeImageIndex === idx ? 'ring-2 ring-[#98e4af]' : 'hover:opacity-90'}`}>
                <img src={imgUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-contain rounded-lg" />
              </button>
            ))}
            <button type="button" onClick={openPicker} className="aspect-square rounded-xl border border-dashed border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center cursor-pointer" title="Upload new product photo">
              <div className="w-6 h-6 rounded-full bg-[#98e4af] flex items-center justify-center text-gray-900"><Plus className="w-3.5 h-3.5" /></div>
            </button>
          </div>
        </>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
};
