
import React, { useState, useRef, useEffect } from 'react';
import { Download, Crosshair, Trash2, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SpriteRect, UserPreferences, Dimensions } from '../../types';

interface SidebarItemProps {
  rect: SpriteRect;
  imageUrl: string | null;
  imageDimensions: Dimensions;
  preferences: UserPreferences;
  onSelect: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (rect: SpriteRect) => void;
  onFocus: (rect: SpriteRect) => void;
  onRename: (id: string, newName: string) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  rect,
  imageUrl,
  imageDimensions,
  preferences,
  onSelect,
  onToggleSelect,
  onDelete,
  onExport,
  onFocus,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(rect.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSaveName = () => {
    if (editName.trim() !== '' && editName !== rect.name) {
      onRename(rect.id, editName.trim());
    } else {
      setEditName(rect.name); // Revert
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') {
      setEditName(rect.name);
      setIsEditing(false);
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      onToggleSelect(rect.id);
    } else {
      onSelect(rect.id);
    }
  };

  const THUMB_SIZE = 36;
  
  const scale = Math.min(THUMB_SIZE / rect.width, THUMB_SIZE / rect.height);
  const scaledW = rect.width * scale;
  const scaledH = rect.height * scale;
  
  const bgWidth = imageDimensions.width * scale;
  const bgHeight = imageDimensions.height * scale;
  
  const bgPosX = -(rect.x * scale);
  const bgPosY = -(rect.y * scale);

  return (
    <li 
      onClick={handleItemClick}
      className={cn(
        "p-2 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer group select-none border-b border-border/40 last:border-0",
        rect.selected ? "bg-muted border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
      )}
    >
      {/* Thumbnail */}
      <div 
        className={cn(
          "shrink-0 bg-neutral-800 rounded flex items-center justify-center text-xs text-muted-foreground border border-white/10 overflow-hidden relative",
          !preferences.showSidebarThumbnails && "w-10 h-10"
        )}
        style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
      >
        {!preferences.showSidebarThumbnails ? (
            <span>{Math.round(rect.width)}x</span>
        ) : imageUrl ? (
           <div
              style={{
                  width: scaledW,
                  height: scaledH,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: `${bgWidth}px ${bgHeight}px`,
                  backgroundPosition: `${bgPosX}px ${bgPosY}px`,
                  backgroundRepeat: 'no-repeat'
              }}
           />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-background border border-primary text-xs px-1 py-0.5 rounded focus:outline-none"
          />
        ) : (
          <div 
            className="flex items-center gap-2 group/name"
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
          >
            <span className="text-sm font-medium truncate text-foreground" title="Double click to rename">{rect.name}</span>
            <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity" />
          </div>
        )}
        <div className="text-xs text-muted-foreground font-mono">
          {Math.round(rect.x)},{Math.round(rect.y)} • {Math.round(rect.width)}x{Math.round(rect.height)}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onExport(rect); }}
          className="p-1.5 hover:bg-background rounded text-muted-foreground hover:text-foreground"
          title="Export PNG"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onFocus(rect); }}
          className="p-1.5 hover:bg-background rounded text-muted-foreground hover:text-primary"
          title="Focus"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(rect.id); }}
          className="p-1.5 hover:bg-background rounded text-muted-foreground hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
};

export default SidebarItem;
