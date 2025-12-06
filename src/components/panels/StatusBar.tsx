import React from 'react';
import { useStore } from '../../store/useStore';
import { useCursorStore } from '../../store/useCursorStore';

const StatusBar: React.FC = () => {
  const { fileName, imageDimensions, scale } = useStore();
  const { x, y } = useCursorStore();

  return (
    <div className="w-full h-full bg-card flex items-center justify-between px-4 text-[11px] font-mono text-muted-foreground select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="opacity-50">File:</span>
          <span className="text-foreground max-w-[200px] truncate" title={fileName || ''}>{fileName || 'No Image'}</span>
        </div>
        {imageDimensions.width > 0 && (
            <div className="flex items-center gap-1">
                <span className="opacity-50">Dim:</span>
                <span className="text-foreground">{imageDimensions.width} x {imageDimensions.height} px</span>
            </div>
        )}
      </div>

      <div className="flex items-center gap-4">
         <div className="flex items-center gap-1 min-w-[100px] justify-end">
            <span className="opacity-50">Cursor:</span>
            <span className="text-foreground">{Math.round(x)}, {Math.round(y)}</span>
         </div>
         <div className="flex items-center gap-1">
            <span className="opacity-50">Zoom:</span>
            <span>{Math.round(scale * 100)}%</span>
         </div>
      </div>
    </div>
  );
};

export default StatusBar;