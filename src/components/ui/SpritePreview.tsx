import React, { useEffect, useRef } from 'react';
import { SpriteRect } from '../../types';

interface SpritePreviewProps {
  imageUrl: string | null;
  rect: SpriteRect;
  className?: string;
}

const SpritePreview: React.FC<SpritePreviewProps> = ({ imageUrl, rect, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      // Set canvas size to match sprite size
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Clear and draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        rect.x, rect.y, rect.width, rect.height,
        0, 0, rect.width, rect.height
      );
    };
  }, [imageUrl, rect.x, rect.y, rect.width, rect.height]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
};

export default SpritePreview;
