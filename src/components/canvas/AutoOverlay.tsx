
import React from 'react';
import { Layer, Rect } from 'react-konva';
import { useStore } from '../../store/useStore';

const AutoOverlay: React.FC = () => {
  const mode = useStore((state) => state.mode);
  const previewRects = useStore((state) => state.previewRects);
  const autoSettings = useStore((state) => state.autoSettings);

  if (mode !== 'AUTO' || previewRects.length === 0) return null;

  return (
    <Layer>
      {previewRects.map((rect) => (
        <Rect
          key={rect.id}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          // Gray for preview
          stroke="rgba(161, 161, 170, 0.8)" 
          strokeWidth={1}
          dash={[2, 2]}
          fill={autoSettings.interactionMode === 'SELECT' ? "rgba(161, 161, 170, 0.1)" : undefined}
          listening={false} 
        />
      ))}
    </Layer>
  );
};

export default AutoOverlay;
