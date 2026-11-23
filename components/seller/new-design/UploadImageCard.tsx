"use client"

import React, { useRef } from 'react';
import Image from 'next/image';
import { Plus, ImagePlus, Video, Play } from 'lucide-react';

interface UploadImageCardProps {
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
              <button key={`${idx}-${imgUrl.slice(0, 24)}`} type="button" onClick={() => onSelectImage(idx)} className={`aspect-square rounded-xl p-1.5 flex items-center justify-center overflow-hidden bg-[#F4F5F7] cursor-pointer ${activeImageIndex === idx ? 'ring-2 ring-[#98e4af]' : 'hover:opacity-90'}`}>
                {isVideoSrc(imgUrl) ? (
                  <span className="w-full h-full flex items-center justify-center text-gray-600"><Play className="w-5 h-5" /></span>
                ) : (
                  <Image src={imgUrl} alt={`Angle ${idx + 1}`} width={96} height={96} unoptimized className="w-full h-full object-contain rounded-lg" />
                )}
              </button>
            ))}
            <button type="button" onClick={openPicker} className="aspect-square rounded-xl border border-dashed border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center cursor-pointer" title="Upload new product photo">
              <div className="w-6 h-6 rounded-full bg-[#98e4af] flex items-center justify-center text-gray-900"><Plus className="w-3.5 h-3.5" /></div>
            </button>
          </div>
        </>
      )}

      {/* Showcase video — autoplayed on cards and the detail page */}
      {onAddVideo && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" /> Showcase video (optional)
          </p>
          {video ? (
            <div className="relative rounded-xl overflow-hidden bg-[#F4F5F7]">
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
              className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-[#F4F5F7] hover:bg-gray-100 transition-colors py-6 px-6 flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-[#98e4af] flex items-center justify-center text-gray-900">
                <Video className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-gray-800">Upload a product video</p>
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
