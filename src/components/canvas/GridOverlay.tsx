
import React from 'react';
import { Layer, Shape } from 'react-konva';
import { useStore } from '../../store/useStore';

const GridOverlay: React.FC = () => {
  const mode = useStore((state) => state.mode);
  const gridSettings = useStore((state) => state.gridSettings);
  const imageDimensions = useStore((state) => state.imageDimensions);

  if (mode !== 'GRID' || !imageDimensions.width) return null;

  return (
    <Layer listening={false}>
      <Shape
        sceneFunc={(context, shape) => {
          const { calculationMode, offsetX, offsetY, gap, padding, allowPartial, columns, rows } = gridSettings;
          
          let width = 0;
          let height = 0;

          if (calculationMode === 'PIXEL') {
              width = gridSettings.width;
              height = gridSettings.height;
          } else {
              // Count mode: Calculate cell size on the fly
              const availW = imageDimensions.width - offsetX - (gap * (columns - 1));
              const availH = imageDimensions.height - offsetY - (gap * (rows - 1));
              if (columns > 0) width = Math.floor(availW / columns);
              if (rows > 0) height = Math.floor(availH / rows);
          }

          if (width <= 0 || height <= 0) return;

          context.beginPath();

          const endY = imageDimensions.height;
          const endX = imageDimensions.width;

          // Limits
          const limitX = allowPartial ? endX + width : endX;
          const limitY = allowPartial ? endY + height : endY;

          // Determine loops
          // If count mode, exact iteration.
          const iterRows = calculationMode === 'COUNT' ? rows : 1000;
          const iterCols = calculationMode === 'COUNT' ? columns : 1000;

          // Safety break
          let c = 0;
          
          for (let r = 0; r < iterRows; r++) {
             const y = offsetY + r * (height + gap);
             if (calculationMode === 'PIXEL' && y >= limitY) break;

             for (let col = 0; col < iterCols; col++) {
                const x = offsetX + col * (width + gap);
                if (calculationMode === 'PIXEL' && x >= limitX) break;
                
                if (!allowPartial) {
                    if (x + width > endX || y + height > endY) continue;
                }
                
                const rX = x + padding;
                const rY = y + padding;
                const rW = width - (padding * 2);
                const rH = height - (padding * 2);

                if (rW > 0 && rH > 0) {
                   context.rect(rX, rY, rW, rH);
                }
                c++;
                if (c > 5000) break; // Hard render limit
             }
             if (c > 5000) break;
          }
          
          context.fillStrokeShape(shape);
        }}
        // Gray for preview
        stroke="rgba(161, 161, 170, 0.5)"
        strokeWidth={1}
        dash={[4, 4]}
      />
    </Layer>
  );
};

export default GridOverlay;
