import React, { useCallback, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import EditorCanvas from './EditorCanvas';
import { toast } from 'sonner';

const CanvasArea: React.FC = () => {
  const imageUrl = useStore((state) => state.imageUrl);
  const setImage = useStore((state) => state.setImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImage(result, img.width, img.height, file.name);
        toast.success(`Loaded ${file.name} (${img.width}x${img.height})`);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (imageUrl) {
    return <EditorCanvas />;
  }

  return (
    <div 
      className="w-full h-full relative flex items-center justify-center bg-neutral-900"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-checkerboard bg-[length:20px_20px]" />
      
      <div className="relative z-10 flex flex-col items-center justify-center text-muted-foreground p-12 border-2 border-dashed border-border rounded-xl bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No Image Loaded</h3>
        <p className="text-sm mt-2 mb-6 max-w-sm text-center">
          Upload a texture atlas or sprite sheet to begin extracting sprites.
          <br/>
          <span className="opacity-70 text-xs">Drag & drop supported</span>
        </p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
        >
            Select File
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default CanvasArea;