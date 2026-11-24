"use client"

import React, { useRef } from 'react';
import Image from 'next/image';
import { Plus, ImagePlus, Video, Play } from 'lucide-react';

interface UploadImageCardProps {
  isDarkMode?: boolean;
  images: string[];
  activeImageIndex: number;
  onSelectImage: (index: number) => void;
  onAddCustomImage: (dataUrl: string) => void;
  /** Showcase video URL (uploaded or remote). Autoplays muted on cards/detail. */
  video?: string;
  onAddVideo?: (dataUrl: string) => void;
  onRemoveVideo?: () => void;
}

export const UploadImageCard: React.FC<UploadImageCardProps> = ({
  isDarkMode = false,
  images,
  activeImageIndex,
  onSelectImage,
  onAddCustomImage,
  video,
  onAddVideo,
  onRemoveVideo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddVideo) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) onAddVideo(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const openPicker = () => fileInputRef.current?.click();
  const openVideoPicker = () => videoInputRef.current?.click();
  const activeSrc = images[Math.min(activeImageIndex, Math.max(0, images.length - 1))];
  const isVideoSrc = (src: string) => /\.(mp4|webm|mov)(\?|$)/i.test(src) || src.startsWith('data:video');

  return (
    <div id="card-upload-img" className={`p-6 sm:p-7 rounded-[22px] border transition-colors ${isDarkMode ? 'bg-[#1e2022] border-gray-800' : 'bg-white border-gray-100/90'}`}>
      <h3 className={`text-[17px] font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Product Media</h3>
      {images.length === 0 ? (
        <button
          type="button"
          onClick={openPicker}
          className={`w-full rounded-2xl border-2 border-dashed transition-colors py-12 px-6 flex flex-col items-center justify-center gap-3 cursor-pointer ${
            isDarkMode ? 'border-gray-700 bg-[#272a2e] hover:bg-[#32363b]' : 'border-gray-300 bg-[#F4F5F7] hover:bg-gray-100'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-[#98e4af]/20 flex items-center justify-center text-emerald-700 dark:text-[#98e4af]">
            <ImagePlus className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Upload product photos</p>
            <p className="text-xs text-gray-400 mt-1">PNG or JPG — first photo becomes the cover</p>
          </div>
        </button>
      ) : (
        <>
          <div className={`w-full rounded-2xl p-4 sm:p-6 mb-4 flex items-center justify-center relative overflow-hidden ${isDarkMode ? 'bg-[#272a2e]' : 'bg-[#F4F5F7]'}`}>
            {activeSrc ? (
              isVideoSrc(activeSrc) ? (
                <video src={activeSrc} className="w-full max-h-72 object-contain" muted loop autoPlay playsInline />
              ) : (
                <Image src={activeSrc} alt="Product Showcase" width={300} height={300} unoptimized className="w-full max-h-72 object-contain" />
              )
            ) : (
              <p className="text-xs text-gray-400">No image yet.</p>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {images.map((imgUrl, idx) => (
              <button key={`${idx}-${imgUrl.slice(0, 24)}`} type="button" onClick={() => onSelectImage(idx)} className={`aspect-square rounded-xl p-1.5 flex items-center justify-center overflow-hidden cursor-pointer ${isDarkMode ? 'bg-[#272a2e]' : 'bg-[#F4F5F7]'} ${activeImageIndex === idx ? 'ring-2 ring-[#98e4af]' : 'hover:opacity-90'}`}>
                {isVideoSrc(imgUrl) ? (
                  <span className="w-full h-full flex items-center justify-center text-gray-400"><Play className="w-5 h-5" /></span>
                ) : (
                  <Image src={imgUrl} alt={`Angle ${idx + 1}`} width={96} height={96} unoptimized className="w-full h-full object-contain rounded-lg" />
                )}
              </button>
            ))}
            <button type="button" onClick={openPicker} className={`aspect-square rounded-xl border border-dashed flex items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'border-gray-700 bg-[#272a2e] hover:bg-[#32363b] text-[#98e4af]' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-800'}`} title="Upload new product photo">
              <div className="w-7 h-7 rounded-lg bg-[#98e4af]/20 flex items-center justify-center"><Plus className="w-4 h-4" /></div>
            </button>
          </div>
        </>
      )}

      {/* Showcase video — autoplayed on cards and the detail page */}
      {onAddVideo && (
        <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <Video className="w-3.5 h-3.5" /> Showcase video (optional)
          </p>
          {video ? (
            <div className={`relative rounded-xl overflow-hidden ${isDarkMode ? 'bg-[#272a2e]' : 'bg-[#F4F5F7]'}`}>
              <video src={video} className="w-full max-h-56 object-contain" muted loop autoPlay playsInline />
              {onRemoveVideo && (
                <button
                  type="button"
                  onClick={onRemoveVideo}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-white/90 text-red-600 text-[11px] font-bold shadow cursor-pointer hover:bg-white"
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openVideoPicker}
              className={`w-full rounded-2xl border-2 border-dashed transition-colors py-6 px-6 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                isDarkMode ? 'border-gray-700 bg-[#272a2e] hover:bg-[#32363b]' : 'border-gray-300 bg-[#F4F5F7] hover:bg-gray-100'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#98e4af]/20 flex items-center justify-center text-emerald-700 dark:text-[#98e4af]">
                <Video className="w-4 h-4" />
              </div>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Upload a product video</p>
              <p className="text-[11px] text-gray-400">MP4 or WebM — plays automatically on the product card</p>
            </button>
          )}
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={videoInputRef} onChange={handleVideoChange} accept="video/mp4,video/webm,video/quicktime" className="hidden" />
    </div>
  );
};
