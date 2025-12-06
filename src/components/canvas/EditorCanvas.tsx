
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { useStore } from '../../store/useStore';
import { useCursorStore } from '../../store/useCursorStore';
import ImageLayer from './ImageLayer';
import SelectionLayer from './SelectionLayer';
import GridOverlay from './GridOverlay';
import AutoOverlay from './AutoOverlay';
import { cn } from '../../lib/utils';
import { SpriteRect } from '../../types';

const SCALE_BY = 1.1;

const EditorCanvas: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  
  const { 
    scale, 
    position, 
    setTransform, 
    mode, 
    addRect, 
    addRects,
    selectRect, 
    toggleSelectRect,
    gridSettings,
    manualSettings,
    autoSettings,
    imageDimensions,
    previewRects,
    rects,
    preferences
  } = useStore();

  const setCursor = useCursorStore((state) => state.setCursor);
  
  // Local state for drawing interaction
  const [isDrawing, setIsDrawing] = useState(false);
  const [newRect, setNewRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  // Box Select Mode State (Grid or Auto)
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);

  // Keyboard listeners for Pan (Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

    // Limit zoom
    if (newScale < 0.1 || newScale > 20) return;

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setTransform(newScale, newPos);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target === stageRef.current) {
      setTransform(e.target.scaleX(), e.target.position());
    }
  };

  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return transform.point(pos);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isSpacePressed) return;

    // 1. Check if clicked on Transformer
    const isTransformer = e.target.getParent() instanceof Konva.Transformer;
    if (isTransformer) return;

    // 2. Check if clicked on a Sprite (Rect)
    const isRect = e.target instanceof Konva.Rect;
    const hasId = !!e.target.id();
    
    if (isRect && hasId) {
      const isModifierPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      if (isModifierPressed) {
        toggleSelectRect(e.target.id());
      } else {
        selectRect(e.target.id());
      }
      return; 
    }

    // 3. Clicked on Background
    selectRect(null);
    const pos = getRelativePointerPosition();
    if (!pos) return;

    // 4. Manual Mode Drawing
    if (mode === 'MANUAL') {
      setIsDrawing(true);
      setNewRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
    }
    
    // 5. Grid/Auto Interactive Mode
    const isGridInteractive = mode === 'GRID' && gridSettings.interactionMode === 'SELECT';
    const isAutoInteractive = mode === 'AUTO' && autoSettings.interactionMode === 'SELECT';

    if (isGridInteractive || isAutoInteractive) {
      setIsBoxSelecting(true);
      setNewRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
    }
  };

  const handleMouseMove = () => {
    const pos = getRelativePointerPosition();
    if (!pos) return;
    
    setCursor(pos.x, pos.y);

    if (isDrawing && newRect && mode === 'MANUAL') {
      let w = pos.x - newRect.x;
      let h = pos.y - newRect.y;

      // Apply Aspect Ratio Constraint (X / Y)
      if (manualSettings.maintainAspectRatio && manualSettings.aspectRatioX > 0 && manualSettings.aspectRatioY > 0) {
        const targetRatio = manualSettings.aspectRatioX / manualSettings.aspectRatioY;
        const signW = Math.sign(w) || 1;
        const signH = Math.sign(h) || 1;
        const absW = Math.abs(w);
        const absH = Math.abs(h);
        
        if (absW > absH * targetRatio) {
            h = (absW / targetRatio) * signH;
            w = absW * signW;
        } else {
            w = (absH * targetRatio) * signW;
            h = absH * signH;
        }
      }
      setNewRect(prev => prev ? { ...prev, w, h } : null);
    }

    if (isBoxSelecting && newRect) {
        setNewRect(prev => prev ? { ...prev, w: pos.x - prev.x, h: pos.y - prev.y } : null);
    }
  };

  const handleMouseUp = () => {
    if (mode === 'MANUAL' && isDrawing && newRect) {
        finalizeManualRect();
    } else if ((mode === 'GRID' || mode === 'AUTO') && isBoxSelecting && newRect) {
        finalizeBoxSelection();
    }
    
    setIsDrawing(false);
    setIsBoxSelecting(false);
    setNewRect(null);
  };

  const getNextName = () => {
    const count = rects.filter(r => r.name.startsWith(preferences.defaultNamingPrefix)).length;
    return `${preferences.defaultNamingPrefix}_${count + 1}`;
  };

  const finalizeManualRect = () => {
    if (!newRect) return;
    const x = newRect.w < 0 ? newRect.x + newRect.w : newRect.x;
    const y = newRect.h < 0 ? newRect.y + newRect.h : newRect.y;
    const width = Math.abs(newRect.w);
    const height = Math.abs(newRect.h);

    if (width > 2 && height > 2) {
      if (!manualSettings.allowPartial) {
         if (x < 0 || y < 0 || x + width > imageDimensions.width || y + height > imageDimensions.height) return;
      }

      addRect({
        id: crypto.randomUUID(),
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        name: getNextName(),
        source: 'MANUAL',
        selected: true
      });
    }
  };

  const calculateGridCellSize = () => {
    if (gridSettings.calculationMode === 'PIXEL') {
        return { w: gridSettings.width, h: gridSettings.height };
    } else {
        const { columns, rows, gap, offsetX, offsetY } = gridSettings;
        if (columns <= 0 || rows <= 0 || !imageDimensions.width) return { w: 0, h: 0 };
        const availW = imageDimensions.width - offsetX - (gap * (columns - 1));
        const availH = imageDimensions.height - offsetY - (gap * (rows - 1));
        return { w: Math.floor(availW / columns), h: Math.floor(availH / rows) };
    }
  };

  const finalizeBoxSelection = () => {
    if (!newRect) return;
    
    const selX = newRect.w < 0 ? newRect.x + newRect.w : newRect.x;
    const selY = newRect.h < 0 ? newRect.y + newRect.h : newRect.y;
    const selW = Math.abs(newRect.w);
    const selH = Math.abs(newRect.h);
    const selRight = selX + selW;
    const selBottom = selY + selH;

    const newSprites: SpriteRect[] = [];
    let counter = rects.filter(r => r.name.startsWith(preferences.defaultNamingPrefix)).length + 1;

    if (mode === 'GRID') {
        const { offsetX, offsetY, gap, padding, allowPartial } = gridSettings;
        const { w: width, h: height } = calculateGridCellSize();

        if (width <= 0 || height <= 0) return;

        const startCol = Math.floor((selX - offsetX) / (width + gap));
        const startRow = Math.floor((selY - offsetY) / (height + gap));
        const endCol = Math.floor((selRight - offsetX) / (width + gap));
        const endRow = Math.floor((selBottom - offsetY) / (height + gap));
        
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const cellX = offsetX + c * (width + gap);
                const cellY = offsetY + r * (height + gap);
                
                const spriteX = cellX + padding;
                const spriteY = cellY + padding;
                const spriteW = width - padding * 2;
                const spriteH = height - padding * 2;
                
                if (spriteW <= 0 || spriteH <= 0) continue;

                const cellRight = spriteX + spriteW;
                const cellBottom = spriteY + spriteH;
                const isOverlapping = !(selRight < spriteX || selX > cellRight || selBottom < spriteY || selY > cellBottom);

                if (isOverlapping) {
                    if (!allowPartial) {
                         if (cellRight > imageDimensions.width || cellBottom > imageDimensions.height) continue;
                         if (spriteX < 0 || spriteY < 0) continue;
                    }

                    newSprites.push({
                        id: crypto.randomUUID(),
                        x: spriteX,
                        y: spriteY,
                        width: spriteW,
                        height: spriteH,
                        name: `${preferences.defaultNamingPrefix}_${counter++}`,
                        source: 'GRID',
                        selected: true
                    });
                }
            }
        }
    } else if (mode === 'AUTO') {
        const { allowPartial } = autoSettings;
        previewRects.forEach((rect) => {
             const rectRight = rect.x + rect.width;
             const rectBottom = rect.y + rect.height;
             
             const isOverlapping = !(selRight < rect.x || selX > rectRight || selBottom < rect.y || selY > rectBottom);
             
             if (isOverlapping) {
                 if (!allowPartial) {
                     if (rectRight > imageDimensions.width || rectBottom > imageDimensions.height) return;
                     if (rect.x < 0 || rect.y < 0) return;
                 }
                 
                 newSprites.push({
                     ...rect,
                     id: crypto.randomUUID(),
                     name: `${preferences.defaultNamingPrefix}_${counter++}`,
                     source: 'AUTO',
                     selected: true
                 });
             }
        });
    }

    if (newSprites.length > 0) {
        addRects(newSprites);
    }
  };

  const isDraggable = isSpacePressed || 
    (mode === 'GRID' && gridSettings.interactionMode === 'GENERATE') ||
    (mode === 'AUTO' && autoSettings.interactionMode === 'GENERATE');

  const bgStyle = {
    backgroundPosition: `${position.x}px ${position.y}px`,
    backgroundSize: `${20 * scale}px ${20 * scale}px`,
  };

  return (
    <div className={cn("w-full h-full bg-neutral-900 overflow-hidden relative")}>
       <div 
        className="absolute inset-0 pointer-events-none opacity-20 bg-checkerboard" 
        style={bgStyle}
      />

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        draggable={isDraggable}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        scale={{ x: scale, y: scale }}
        x={position.x}
        y={position.y}
        style={{ cursor: isSpacePressed ? 'grab' : 'default' }}
      >
        <Layer imageSmoothingEnabled={false}>
          <ImageLayer />
        </Layer>
        
        {(newRect && (isDrawing || isBoxSelecting)) && (
          <Layer>
            <Rect
              x={newRect.w < 0 ? newRect.x + newRect.w : newRect.x}
              y={newRect.h < 0 ? newRect.y + newRect.h : newRect.y}
              width={Math.abs(newRect.w)}
              height={Math.abs(newRect.h)}
              stroke="#06b6d4"
              strokeWidth={1 / scale}
              dash={[5 / scale, 5 / scale]}
              fill="rgba(6, 182, 212, 0.1)"
            />
          </Layer>
        )}

        <GridOverlay />
        <AutoOverlay />
        <SelectionLayer />
      </Stage>

      <div className="absolute bottom-4 left-4 text-white/50 text-xs pointer-events-none select-none z-10">
        {isSpacePressed ? "Panning..." : 
          mode === 'MANUAL' ? "Drag to cut • Space+Drag to pan" : 
          ((mode === 'GRID' && gridSettings.interactionMode === 'SELECT') || (mode === 'AUTO' && autoSettings.interactionMode === 'SELECT')) ? "Click or Drag to add sprites" :
          "Space+Drag to pan"}
      </div>
    </div>
  );
};

export default EditorCanvas;
