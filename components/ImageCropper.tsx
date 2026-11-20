
import React, { useState, useRef, useEffect } from 'react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onCancel: () => void;
}

interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'move' | null;

const HANDLE_SIZE = 24; // Touch friendly size
const MIN_SIZE = 40;

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeHandle, setActiveHandle] = useState<HandleType>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialSelection: { x: 0, y: 0, w: 0, h: 0 } });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => setImgElement(img);
  }, [imageSrc]);

  // Handle Resize and Initial Selection
  useEffect(() => {
    if (!imgElement || !containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current || !imgElement) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight || window.innerHeight * 0.7;
      
      const scale = Math.min(
        containerWidth / imgElement.width,
        containerHeight / imgElement.height
      );

      const w = imgElement.width * scale;
      const h = imgElement.height * scale;
      setDimensions({ width: w, height: h });

      // Default selection (center 60%)
      setSelection({
        x: w * 0.2,
        y: h * 0.2,
        w: w * 0.6,
        h: h * 0.6
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [imgElement]);

  // Draw Loop
  useEffect(() => {
    if (!imgElement || !canvasRef.current || dimensions.width === 0 || !selection) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // 1. Draw original image dimmed
    ctx.drawImage(imgElement, 0, 0, dimensions.width, dimensions.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw clear "cutout" area
    ctx.save();
    ctx.beginPath();
    ctx.rect(selection.x, selection.y, selection.w, selection.h);
    ctx.clip();
    ctx.drawImage(imgElement, 0, 0, dimensions.width, dimensions.height);
    ctx.restore();

    // 3. Draw border and handles
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);

    // Draw Corners
    ctx.fillStyle = '#f59e0b';
    const corners = [
      { x: selection.x, y: selection.y }, // NW
      { x: selection.x + selection.w, y: selection.y }, // NE
      { x: selection.x, y: selection.y + selection.h }, // SW
      { x: selection.x + selection.w, y: selection.y + selection.h } // SE
    ];

    corners.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw "Bars" (Midpoints for easier grabbing on mobile)
    const bars = [
      { x: selection.x + selection.w / 2, y: selection.y }, // Top
      { x: selection.x + selection.w / 2, y: selection.y + selection.h }, // Bottom
      { x: selection.x, y: selection.y + selection.h / 2 }, // Left
      { x: selection.x + selection.w, y: selection.y + selection.h / 2 } // Right
    ];
    
    ctx.fillStyle = '#fff';
    bars.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [imgElement, selection, dimensions]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const detectHandle = (x: number, y: number): HandleType => {
    if (!selection) return null;
    const { x: sx, y: sy, w: sw, h: sh } = selection;

    // Check corners
    if (Math.hypot(x - sx, y - sy) < HANDLE_SIZE) return 'nw';
    if (Math.hypot(x - (sx + sw), y - sy) < HANDLE_SIZE) return 'ne';
    if (Math.hypot(x - sx, y - (sy + sh)) < HANDLE_SIZE) return 'sw';
    if (Math.hypot(x - (sx + sw), y - (sy + sh)) < HANDLE_SIZE) return 'se';

    // Check if inside for move
    if (x > sx && x < sx + sw && y > sy && y < sy + sh) return 'move';

    return null;
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!selection) return;
    const coords = getCoordinates(e);
    const handle = detectHandle(coords.x, coords.y);
    if (handle) {
      setActiveHandle(handle);
      setDragStart({ x: coords.x, y: coords.y, initialSelection: { ...selection } });
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeHandle || !selection) return;
    const coords = getCoordinates(e);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;
    const { initialSelection: s } = dragStart;

    let next = { ...selection };

    if (activeHandle === 'move') {
      next.x = Math.max(0, Math.min(s.x + dx, dimensions.width - s.w));
      next.y = Math.max(0, Math.min(s.y + dy, dimensions.height - s.h));
    } else {
      if (activeHandle.includes('n')) {
        const newY = Math.min(s.y + dy, s.y + s.h - MIN_SIZE);
        next.h = s.h + (s.y - newY);
        next.y = newY;
      }
      if (activeHandle.includes('s')) {
        next.h = Math.max(MIN_SIZE, Math.min(s.h + dy, dimensions.height - s.y));
      }
      if (activeHandle.includes('w')) {
        const newX = Math.min(s.x + dx, s.x + s.w - MIN_SIZE);
        next.w = s.w + (s.x - newX);
        next.x = newX;
      }
      if (activeHandle.includes('e')) {
        next.w = Math.max(MIN_SIZE, Math.min(s.w + dx, dimensions.width - s.x));
      }
    }

    setSelection(next);
  };

  const handleEnd = () => {
    setActiveHandle(null);
  };

  const executeCrop = () => {
    if (!imgElement || !selection) return;
    
    const scaleX = imgElement.width / dimensions.width;
    const scaleY = imgElement.height / dimensions.height;
    
    const targetW = selection.w * scaleX;
    const targetH = selection.h * scaleY;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = targetW;
    cropCanvas.height = targetH;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    cropCtx.drawImage(
      imgElement, 
      selection.x * scaleX, 
      selection.y * scaleY, 
      targetW, 
      targetH, 
      0, 0, targetW, targetH
    );
    
    onCropComplete(cropCanvas.toDataURL('image/jpeg', 0.95));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col items-center justify-center p-0 md:p-4 backdrop-blur-xl">
      <div className="bg-white md:rounded-3xl w-full h-full md:h-auto max-w-5xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex flex-col">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Crop Bar & Handles</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Drag corners to resize selection</p>
          </div>
          <div className="flex space-x-3">
             <button onClick={onCancel} className="px-4 py-2 text-[10px] font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Cancel</button>
             <button 
              onClick={executeCrop} 
              className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg bg-amber-500 text-slate-950 shadow-amber-500/20 active:scale-95 transition-all"
             >
               Apply Crop
             </button>
          </div>
        </div>
        
        <div 
          ref={containerRef} 
          className="flex-grow flex items-center justify-center bg-slate-200 min-h-[300px] relative overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          <canvas 
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="max-w-full max-h-full border border-slate-300 shadow-2xl bg-white cursor-move"
          />
        </div>
        
        <div className="p-4 text-center bg-slate-50 shrink-0 border-t border-slate-100 flex justify-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Resize corners</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Drag center to move</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
