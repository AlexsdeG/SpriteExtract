
import React, { useRef, useEffect } from 'react';
import { Layer, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { useStore } from '../../store/useStore';

const SelectionLayer: React.FC = () => {
  const { 
    rects, 
    updateRect, 
    mode, 
    gridSettings,
    manualSettings,
    autoSettings
  } = useStore();
  
  const trRef = useRef<Konva.Transformer>(null);

  // Filter rects to only show those belonging to current mode
  const visibleRects = rects.filter(r => r.source === mode);
  const selectedRects = visibleRects.filter((r) => r.selected);

  useEffect(() => {
    const tr = trRef.current;
    if (tr && typeof tr.nodes === 'function') {
      const stage = tr.getStage();
      const selectedNodes = selectedRects
        .map(rect => stage?.findOne('#' + rect.id))
        .filter((node): node is Konva.Node => !!node);
      
      tr.nodes(selectedNodes);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedRects, visibleRects]); // Depend on visibleRects to update when mode changes

  // Determine if sprites are locked
  const isLocked = () => {
    if (mode === 'GRID') return gridSettings.lockSprites;
    if (mode === 'AUTO') return autoSettings.lockSprites;
    if (mode === 'MANUAL') return manualSettings.lockSprites;
    return false;
  };

  const isDraggable = !isLocked();

  const checkOverlap = (id: string, newAttrs: {x: number, y: number, width: number, height: number}) => {
    if (mode !== 'MANUAL' || !manualSettings.preventOverlap) return false;

    // Check collision with other visible rects
    for (const r of visibleRects) {
      if (r.id === id) continue;
      
      if (
        newAttrs.x < r.x + r.width &&
        newAttrs.x + newAttrs.width > r.x &&
        newAttrs.y < r.y + r.height &&
        newAttrs.y + newAttrs.height > r.y
      ) {
        return true;
      }
    }
    return false;
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const newX = Math.round(e.target.x());
    const newY = Math.round(e.target.y());
    
    // Revert if overlap
    if (manualSettings.preventOverlap && mode === 'MANUAL') {
        const node = e.target;
        const potential = { x: newX, y: newY, width: node.width() * node.scaleX(), height: node.height() * node.scaleY() };
        if (checkOverlap(id, potential)) {
            const original = rects.find(r => r.id === id);
            if (original) {
                node.position({ x: original.x, y: original.y });
                return;
            }
        }
    }

    updateRect(id, { x: newX, y: newY });
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>, id: string) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);

    const newW = Math.max(5, Math.round(Math.abs(node.width() * scaleX)));
    const newH = Math.max(5, Math.round(Math.abs(node.height() * scaleY)));
    const newX = Math.round(node.x());
    const newY = Math.round(node.y());

    // Update rect
    updateRect(id, {
      x: newX,
      y: newY,
      width: newW,
      height: newH,
    });
  };

  return (
    <Layer>
      {visibleRects.map((rect) => (
        <Rect
          key={rect.id}
          id={rect.id}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          // Unified Colors: Green (#22c55e) for saved, Yellow (#facc15) for selected
          stroke={rect.selected ? "#facc15" : "#22c55e"} 
          strokeWidth={rect.selected ? 2 : 1}
          fill={rect.selected ? "rgba(250, 204, 21, 0.1)" : "transparent"}
          draggable={isDraggable} 
          onDragEnd={(e) => handleDragEnd(e, rect.id)}
          onTransformEnd={(e) => handleTransformEnd(e, rect.id)}
          onMouseEnter={(e) => {
            if (isDraggable) {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'move';
            }
          }}
          onMouseLeave={(e) => {
             const container = e.target.getStage()?.container();
             if (container) container.style.cursor = 'default';
          }}
        />
      ))}

      {/* Transformer */}
      {isDraggable && (
        <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
            }}
            keepRatio={mode === 'MANUAL' && manualSettings.maintainAspectRatio}
            rotateEnabled={false}
            borderStroke="#facc15"
            anchorStroke="#facc15"
            anchorFill="#18181b"
            anchorSize={8}
        />
      )}
    </Layer>
  );
};

export default SelectionLayer;
