
import React, { useRef } from 'react';

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  onRemoveImage: (index: number) => void;
  onClearAll: () => void;
  images: string[];
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, onRemoveImage, onClearAll, images, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
        // Reset input to allow selecting same file again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Evidence Set ({images.length})
        </label>
        {images.length > 0 && (
          <button 
            onClick={onClearAll}
            disabled={disabled}
            className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 disabled:opacity-50"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {images.map((img, idx) => (
          <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-slate-200 bg-white aspect-video flex items-center justify-center">
            <img src={img} alt={`Capture ${idx}`} className="max-w-full max-h-full object-contain" />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <button 
                onClick={() => onRemoveImage(idx)}
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-1 right-1 bg-slate-900/80 text-[8px] text-white px-1.5 py-0.5 rounded font-black">
              #{idx + 1}
            </div>
          </div>
        ))}
        
        {images.length < 4 && (
          <div 
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`
              border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center 
              bg-slate-50 transition-all duration-200 cursor-pointer aspect-video
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-400 hover:bg-amber-50'}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Add Image</span>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
        disabled={disabled}
      />
    </div>
  );
};

export default ImageUpload;
