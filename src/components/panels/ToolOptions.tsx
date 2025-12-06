
import React, { useEffect, useRef } from 'react';
import { Play, Loader2, Lock, Unlock, MousePointerClick, BoxSelect, Trash2, Wand2, Hash, Ruler } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useOpenCV } from '../../hooks/useOpenCV';
import { detectSprites } from '../../lib/cvHelper';
import { toast } from 'sonner';
import { SpriteRect } from '../../types';
import { cn } from '../../lib/utils';

const ToolOptions: React.FC = () => {
  const {
    mode,
    imageUrl,
    imageDimensions,
    rects,
    addRects,
    gridSettings,
    setGridSettings,
    autoSettings,
    setAutoSettings,
    manualSettings,
    setManualSettings,
    removeSelected,
    setPreviewRects,
    preferences
  } = useStore();

  const isCvLoaded = useOpenCV();
  const detectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Manual Handlers ---
  const updateManual = (key: keyof typeof manualSettings, value: any) => {
    setManualSettings({ [key]: value });
  };

  // --- Grid Handlers ---
  const updateGrid = (key: keyof typeof gridSettings, value: string | boolean | number) => {
    // Handle enum/string union types explicitly to avoid parseInt NaN issues
    if (key === 'interactionMode' || key === 'calculationMode') {
        setGridSettings({ [key]: value as any });
        return;
    }

    if (typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num)) setGridSettings({ [key]: num });
    } else {
        setGridSettings({ [key]: value });
    }
  };

  const calculateGridDimensions = () => {
    if (gridSettings.calculationMode === 'PIXEL') {
        return { w: gridSettings.width, h: gridSettings.height };
    } else {
        // Count mode
        const { columns, rows, gap, offsetX, offsetY } = gridSettings;
        if (columns <= 0 || rows <= 0 || !imageDimensions.width) return { w: 0, h: 0 };

        const availW = imageDimensions.width - offsetX - (gap * (columns - 1));
        const availH = imageDimensions.height - offsetY - (gap * (rows - 1));
        
        const w = Math.floor(availW / columns);
        const h = Math.floor(availH / rows);
        return { w, h };
    }
  };

  const handleGenerateGrid = () => {
    if (!imageDimensions.width) {
      toast.error("Load an image first");
      return;
    }

    const { offsetX, offsetY, gap, padding, allowPartial, columns, rows } = gridSettings;
    const { w: width, h: height } = calculateGridDimensions();
    
    if (width <= 0 || height <= 0) {
        toast.error("Invalid grid dimensions");
        return;
    }

    const newRects: SpriteRect[] = [];
    
    // Limits
    const limitX = allowPartial ? imageDimensions.width + width : imageDimensions.width;
    const limitY = allowPartial ? imageDimensions.height + height : imageDimensions.height;

    const colsToIterate = gridSettings.calculationMode === 'COUNT' ? columns : Math.floor((imageDimensions.width - offsetX) / (width + gap));
    const rowsToIterate = gridSettings.calculationMode === 'COUNT' ? rows : Math.floor((imageDimensions.height - offsetY) / (height + gap));

    if (colsToIterate > 1000 || rowsToIterate > 1000) {
         if(!window.confirm(`This will generate approx ${colsToIterate * rowsToIterate} sprites. Continue?`)) return;
    }

    // Determine starting index based on existing sprites with same prefix
    const existingCount = rects.filter(r => r.name.startsWith(preferences.defaultNamingPrefix)).length;
    let counter = existingCount + 1;

    for (let r = 0; r < rowsToIterate; r++) {
         for (let c = 0; c < colsToIterate; c++) {
              const x = offsetX + c * (width + gap);
              const y = offsetY + r * (height + gap);

              if (!allowPartial && gridSettings.calculationMode === 'PIXEL') {
                  if (x + width > imageDimensions.width || y + height > imageDimensions.height) continue;
              }

              const rX = x + padding;
              const rY = y + padding;
              const rW = width - (padding * 2);
              const rH = height - (padding * 2);

              if (rW > 0 && rH > 0) {
                newRects.push({
                  id: crypto.randomUUID(),
                  x: Math.round(rX),
                  y: Math.round(rY),
                  width: Math.round(rW),
                  height: Math.round(rH),
                  name: `${preferences.defaultNamingPrefix}_${counter}`,
                  source: 'GRID',
                  selected: false
                });
                counter++;
              }
         }
    }

    if (newRects.length > 0) {
      addRects(newRects);
      toast.success(`Generated ${newRects.length} sprites`);
    } else {
        toast.warning("No sprites generated. Check offsets/dimensions.");
    }
  };

  // --- Auto Handlers ---
  const updateAuto = (key: keyof typeof autoSettings, value: string | number | boolean) => {
    // Handle strings correctly for modes
    if (key === 'interactionMode') {
        setAutoSettings({ [key]: value as any });
        return;
    }

    if (typeof value === 'string') {
        const num = parseInt(value, 10);
        if (!isNaN(num)) setAutoSettings({ [key]: num });
    } else {
        setAutoSettings({ [key]: value });
    }
  };

  // Auto-Detect Preview Logic
  useEffect(() => {
    if (mode !== 'AUTO' || !isCvLoaded || !imageUrl) return;

    // Debounce detection
    if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
    
    detectionTimeoutRef.current = setTimeout(async () => {
      try {
        const { threshold, minArea, padding, margin } = autoSettings;
        const detected = await detectSprites(imageUrl, threshold, minArea, padding, margin);
        setPreviewRects(detected);
      } catch (e) {
        console.error("Auto-preview failed", e);
      }
    }, 300);

    return () => {
      if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
    };
  }, [mode, imageUrl, isCvLoaded, autoSettings.threshold, autoSettings.minArea, autoSettings.padding, autoSettings.margin]);

  const handleAutoGenerate = async () => {
     const currentPreview = useStore.getState().previewRects;
     if (currentPreview.length > 0) {
         
         const { allowPartial } = autoSettings;
         const existingCount = rects.filter(r => r.name.startsWith(preferences.defaultNamingPrefix)).length;
         
         let counter = existingCount + 1;
         
         const toAdd = currentPreview.map(r => ({
             ...r,
             id: crypto.randomUUID(),
             name: `${preferences.defaultNamingPrefix}_${counter++}`,
             source: 'AUTO' as const,
             selected: false
         }));

         const filtered = allowPartial ? toAdd : toAdd.filter(r => 
             r.x >= 0 && r.y >= 0 && r.x + r.width <= imageDimensions.width && r.y + r.height <= imageDimensions.height
         );
         
         if (filtered.length > 0) {
             addRects(filtered);
             toast.success(`Added ${filtered.length} sprites`);
         } else {
             toast.warning("No valid sprites found within bounds");
         }
     }
  };

  return (
    <div className="w-full h-12 flex items-center px-4 overflow-x-auto no-scrollbar gap-4 text-sm bg-muted/20 border-b border-border shadow-inner">
      
      {/* MANUAL MODE TOOLS */}
      {mode === 'MANUAL' && (
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-1">
           <div className="flex items-center gap-2">
             <input 
               type="checkbox" 
               id="ratio" 
               checked={manualSettings.maintainAspectRatio}
               onChange={(e) => updateManual('maintainAspectRatio', e.target.checked)}
               className="rounded border-input bg-background"
               title="Maintain Aspect Ratio\nLocks the width/height ratio while drawing."
             />
             <label htmlFor="ratio" className="text-muted-foreground select-none cursor-pointer" title="Maintain Aspect Ratio">Fixed Ratio</label>
           </div>
           
           {manualSettings.maintainAspectRatio && (
             <div className="flex items-center gap-1">
               <input 
                 type="number"
                 value={manualSettings.aspectRatioX}
                 onChange={(e) => updateManual('aspectRatioX', parseFloat(e.target.value))}
                 className="w-10 h-6 text-xs text-center rounded border border-input bg-background"
                 step="1"
                 title="Aspect Ratio X\nExample: 16\nWidth component of the ratio."
               />
               <span className="text-xs text-muted-foreground">:</span>
               <input 
                 type="number"
                 value={manualSettings.aspectRatioY}
                 onChange={(e) => updateManual('aspectRatioY', parseFloat(e.target.value))}
                 className="w-10 h-6 text-xs text-center rounded border border-input bg-background"
                 step="1"
                 title="Aspect Ratio Y\nExample: 9\nHeight component of the ratio."
               />
             </div>
           )}

           <div className="w-px h-6 bg-border mx-2" />

           <div className="flex items-center gap-2">
             <input 
               type="checkbox" 
               id="overlap"
               checked={manualSettings.preventOverlap}
               onChange={(e) => updateManual('preventOverlap', e.target.checked)}
               className="rounded border-input bg-background"
               title="Prevent Overlap\nDisallows moving sprites on top of each other."
             />
             <label htmlFor="overlap" className="text-muted-foreground select-none cursor-pointer" title="Prevent Overlap">Prevent Overlap</label>
           </div>
           
           <div className="w-px h-6 bg-border mx-2" />
           
           <button
                onClick={() => updateManual('lockSprites', !manualSettings.lockSprites)}
                className={cn(
                    "p-1.5 rounded-md border border-input transition-colors",
                    manualSettings.lockSprites ? "bg-muted text-primary" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                title="Lock Sprites\nPrevents moving or resizing existing sprites."
            >
                {manualSettings.lockSprites ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>

            <button
                onClick={() => updateManual('allowPartial', !manualSettings.allowPartial)}
                className={cn(
                    "text-xs px-2 py-1 rounded border transition-colors",
                    manualSettings.allowPartial ? "bg-primary/20 border-primary text-primary" : "bg-background border-input text-muted-foreground"
                )}
                title="Allow Partial\nPermit sprites to extend outside the image canvas."
            >
                Partial
            </button>
        </div>
      )}

      {/* GRID MODE TOOLS */}
      {mode === 'GRID' && (
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 min-w-max">
           {/* Mode Switch: Pixel vs Count */}
           <div className="flex items-center bg-background rounded-md border border-input p-0.5">
               <button
                  onClick={() => updateGrid('calculationMode', 'PIXEL')}
                  className={cn(
                      "p-1 rounded flex items-center gap-1 text-xs",
                      gridSettings.calculationMode === 'PIXEL' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Pixel Mode\nDefine grid by cell width and height in pixels."
               >
                   <Ruler className="w-3.5 h-3.5" />
               </button>
               <button
                  onClick={() => updateGrid('calculationMode', 'COUNT')}
                  className={cn(
                      "p-1 rounded flex items-center gap-1 text-xs",
                      gridSettings.calculationMode === 'COUNT' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Count Mode\nDefine grid by total number of rows and columns."
               >
                   <Hash className="w-3.5 h-3.5" />
               </button>
           </div>

           <div className="w-px h-6 bg-border" />

           {/* Dynamic Inputs based on Calculation Mode */}
           {gridSettings.calculationMode === 'PIXEL' ? (
                <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground font-mono">Cell</span>
                    <input 
                    type="number" value={gridSettings.width}
                    onChange={(e) => updateGrid('width', e.target.value)}
                    className="w-10 h-6 bg-background border border-input rounded text-xs text-center"
                    placeholder="W"
                    title="Cell Width (px)\nExample: 32\nWidth of each grid cell."
                    />
                    <span className="text-muted-foreground text-xs">x</span>
                    <input 
                    type="number" value={gridSettings.height}
                    onChange={(e) => updateGrid('height', e.target.value)}
                    className="w-10 h-6 bg-background border border-input rounded text-xs text-center"
                    placeholder="H"
                    title="Cell Height (px)\nExample: 32\nHeight of each grid cell."
                    />
                </div>
           ) : (
                <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground font-mono">Grid</span>
                    <input 
                    type="number" value={gridSettings.columns}
                    onChange={(e) => updateGrid('columns', e.target.value)}
                    className="w-10 h-6 bg-background border border-input rounded text-xs text-center"
                    placeholder="Cols"
                    title="Columns (Count)\nExample: 4\nNumber of vertical columns."
                    />
                    <span className="text-muted-foreground text-xs">x</span>
                    <input 
                    type="number" value={gridSettings.rows}
                    onChange={(e) => updateGrid('rows', e.target.value)}
                    className="w-10 h-6 bg-background border border-input rounded text-xs text-center"
                    placeholder="Rows"
                    title="Rows (Count)\nExample: 4\nNumber of horizontal rows."
                    />
                </div>
           )}

           <div className="w-px h-6 bg-border" />

           {/* Gap & Offsets */}
           <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground font-mono">Gap</span>
                <input 
                  type="number" value={gridSettings.gap}
                  onChange={(e) => updateGrid('gap', e.target.value)}
                  className="w-10 h-6 bg-background border border-input rounded text-xs text-center"
                  title="Gap (px)\nExample: 2\nSpace between grid cells."
                />
           </div>

           <div className="flex items-center gap-1 ml-2">
                <span className="text-xs text-muted-foreground font-mono">Off</span>
                <input 
                  type="number" value={gridSettings.offsetX}
                  onChange={(e) => updateGrid('offsetX', e.target.value)}
                  className="w-10 h-6 bg-background border border-input rounded text-xs text-center"
                  placeholder="X"
                  title="Offset X (px)\nExample: 10\nHorizontal start position."
                />
                <input 
                  type="number" value={gridSettings.offsetY}
                  onChange={(e) => updateGrid('offsetY', e.target.value)}
                  className="w-10 h-6 bg-background border border-input rounded text-xs text-center"
                  placeholder="Y"
                  title="Offset Y (px)\nExample: 10\nVertical start position."
                />
           </div>
           
           <div className="w-px h-6 bg-border" />
            
            {/* Interaction Switch */}
            <div className="flex items-center bg-background rounded-md border border-input p-0.5">
                <button
                    onClick={() => updateGrid('interactionMode', 'GENERATE')}
                    className={cn(
                        "p-1 rounded flex items-center gap-1 text-xs",
                        gridSettings.interactionMode === 'GENERATE' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Generate Mode\nAutomatically creates sprites for the entire grid."
                >
                    <BoxSelect className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => updateGrid('interactionMode', 'SELECT')}
                    className={cn(
                        "p-1 rounded flex items-center gap-1 text-xs",
                        gridSettings.interactionMode === 'SELECT' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Interactive Mode\nClick or drag on grid cells to add them manually."
                >
                    <MousePointerClick className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="w-px h-6 bg-border" />

            <button
                onClick={() => updateGrid('lockSprites', !gridSettings.lockSprites)}
                className={cn(
                    "p-1.5 rounded-md border border-input transition-colors",
                    gridSettings.lockSprites ? "bg-muted text-primary" : "bg-background text-muted-foreground hover:text-foreground"
                )}
                title="Lock Sprites\nPrevents moving or resizing existing sprites."
            >
                {gridSettings.lockSprites ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>

            <button
                onClick={() => updateGrid('allowPartial', !gridSettings.allowPartial)}
                className={cn(
                    "text-xs px-2 py-1 rounded border transition-colors",
                    gridSettings.allowPartial ? "bg-primary/20 border-primary text-primary" : "bg-background border-input text-muted-foreground"
                )}
                title="Allow Partial\nPermit grid cells to extend outside the image canvas."
            >
                Part
            </button>

            {gridSettings.interactionMode === 'GENERATE' && (
                <>
                <div className="w-px h-6 bg-border" />
                <button 
                onClick={handleGenerateGrid}
                className="flex items-center gap-1.5 px-3 py-1 bg-primary hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors shadow-sm"
                title="Run Generation\nCreate sprites based on current settings."
                >
                <Play className="w-3 h-3 fill-current" />
                Run
                </button>
                </>
            )}
        </div>
      )}

      {/* AUTO MODE TOOLS */}
      {mode === 'AUTO' && (
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-1">
             {!isCvLoaded ? (
               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                 <Loader2 className="w-3 h-3 animate-spin" />
                 Loading CV Engine...
               </div>
             ) : (
               <>
                 <div className="flex items-center gap-2" title="Alpha Threshold\nSensitivity to transparency.\nLower = More sensitive.\nRange: 1-254">
                    <span className="text-xs text-muted-foreground font-mono">Thr</span>
                    <input 
                      type="range" min="1" max="254" 
                      value={autoSettings.threshold}
                      onChange={(e) => updateAuto('threshold', e.target.value)}
                      className="w-16 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                 </div>

                 <div className="flex items-center gap-1.5" title="Min Area (px²)\nExample: 100\nSmallest allowed sprite size. Filters out noise/dust.">
                    <span className="text-xs text-muted-foreground font-mono">Area</span>
                    <input 
                      type="number" 
                      value={autoSettings.minArea}
                      onChange={(e) => updateAuto('minArea', e.target.value)}
                      className="w-12 h-6 bg-background border border-input rounded text-xs text-center"
                    />
                 </div>
                 
                 <div className="flex items-center gap-1.5" title="Margin (px)\nExample: 5\nExpands search area to merge close items together.">
                    <span className="text-xs text-muted-foreground font-mono">Mrg</span>
                    <input 
                      type="number" 
                      value={autoSettings.margin}
                      onChange={(e) => updateAuto('margin', e.target.value)}
                      className="w-10 h-6 bg-background border border-input rounded text-xs text-center"
                    />
                 </div>

                 <div className="flex items-center gap-1.5" title="Padding (px)\nExample: 2\nAdds or removes pixels from the final detected box.">
                    <span className="text-xs text-muted-foreground font-mono">Pad</span>
                    <input 
                      type="number" 
                      value={autoSettings.padding}
                      onChange={(e) => updateAuto('padding', e.target.value)}
                      className="w-10 h-6 bg-background border border-input rounded text-xs text-center"
                    />
                 </div>

                 <div className="w-px h-6 bg-border" />
                 
                 <div className="flex items-center bg-background rounded-md border border-input p-0.5">
                    <button
                        onClick={() => updateAuto('interactionMode', 'GENERATE')}
                        className={cn(
                            "p-1 rounded flex items-center gap-1 text-xs",
                            autoSettings.interactionMode === 'GENERATE' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Auto-Gen Mode\nAutomatically adds all detected sprites."
                    >
                        <BoxSelect className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => updateAuto('interactionMode', 'SELECT')}
                        className={cn(
                            "p-1 rounded flex items-center gap-1 text-xs",
                            autoSettings.interactionMode === 'SELECT' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Interactive Mode\nClick on detected areas to add them manually."
                    >
                        <MousePointerClick className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="w-px h-6 bg-border" />

                <button
                    onClick={() => updateAuto('lockSprites', !autoSettings.lockSprites)}
                    className={cn(
                        "p-1.5 rounded-md border border-input transition-colors",
                        autoSettings.lockSprites ? "bg-muted text-primary" : "bg-background text-muted-foreground hover:text-foreground"
                    )}
                    title="Lock Sprites\nPrevents moving or resizing existing sprites."
                >
                    {autoSettings.lockSprites ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                <button
                    onClick={() => updateAuto('allowPartial', !autoSettings.allowPartial)}
                    className={cn(
                        "text-xs px-2 py-1 rounded border transition-colors",
                        autoSettings.allowPartial ? "bg-primary/20 border-primary text-primary" : "bg-background border-input text-muted-foreground"
                    )}
                    title="Allow Partial\nPermit detected sprites to extend outside the image canvas."
                >
                    Part
                </button>

                 {autoSettings.interactionMode === 'GENERATE' && (
                    <>
                    <div className="w-px h-6 bg-border" />
                    <button 
                        onClick={handleAutoGenerate}
                        className="flex items-center gap-1.5 px-3 py-1 bg-primary hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors shadow-sm"
                        title="Run Auto-Detect\nAdd all visible previewed sprites to the list."
                    >
                        <Wand2 className="w-3 h-3" />
                        Run
                    </button>
                    </>
                 )}
               </>
             )}
        </div>
      )}
    </div>
  );
};

export default ToolOptions;
