import React, { useState } from 'react';
import { Layers, Download, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { exportAllSprites, exportSprite } from '../../lib/exportUtils';
import { toast } from 'sonner';
import SidebarItem from './SidebarItem';
import { SpriteRect } from '../../types';

const Sidebar: React.FC = () => {
  const rects = useStore((state) => state.rects);
  const removeRect = useStore((state) => state.removeRect);
  const selectRect = useStore((state) => state.selectRect);
  const toggleSelectRect = useStore((state) => state.toggleSelectRect);
  const clearRects = useStore((state) => state.clearRects);
  const updateRect = useStore((state) => state.updateRect);
  const { setTransform, scale, imageUrl, fileName, imageDimensions, preferences } = useStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleFocus = (rect: SpriteRect) => {
    // Center the view on this rect
    // Calculation: viewportCenter - (rectCenter * scale)
    const viewportW = window.innerWidth - 300; // Approx width minus sidebar
    const viewportH = window.innerHeight - 60; // Approx height minus toolbar
    
    const rectCX = rect.x + rect.width / 2;
    const rectCY = rect.y + rect.height / 2;

    const newX = (viewportW / 2) - (rectCX * scale);
    const newY = (viewportH / 2) - (rectCY * scale);

    setTransform(scale, { x: newX, y: newY });
    selectRect(rect.id);
  };

  const handleExportAll = async () => {
    if (!imageUrl || rects.length === 0) return;
    
    setIsExporting(true);
    const toastId = toast.loading("Exporting sprites...");
    try {
      await exportAllSprites(imageUrl, rects, `sprites_${fileName || 'export'}.zip`);
      toast.success("Export complete!", { id: toastId });
    } catch (e) {
      toast.error("Export failed", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSingle = async (rect: SpriteRect) => {
    if (!imageUrl) return;
    
    toast.promise(exportSprite(imageUrl, rect), {
      loading: 'Exporting...',
      success: 'Exported sprite',
      error: 'Failed to export'
    });
  };

  const handleRename = (id: string, newName: string) => {
    updateRect(id, { name: newName });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-card">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Sprites ({rects.length})
        </h2>
        {rects.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm('Clear all sprites?')) clearRects();
            }}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-card">
        {rects.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-medium">No sprites selected</p>
            <p className="text-xs mt-1 text-center max-w-[200px] opacity-70">
              Load an image and start cutting to see sprites here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rects.map((rect) => (
              <SidebarItem 
                key={rect.id}
                rect={rect}
                imageUrl={imageUrl}
                imageDimensions={imageDimensions}
                preferences={preferences}
                onSelect={selectRect}
                onToggleSelect={toggleSelectRect}
                onDelete={removeRect}
                onExport={handleExportSingle}
                onFocus={handleFocus}
                onRename={handleRename}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border bg-card">
        <button 
          onClick={handleExportAll}
          disabled={rects.length === 0 || isExporting}
          className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? 'Exporting...' : `Export All (${rects.length})`}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
