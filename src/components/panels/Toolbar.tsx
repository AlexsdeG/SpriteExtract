
import React, { useRef, useState } from 'react';
import { Upload, Scissors, Grid3X3, Wand2, ZoomIn, ZoomOut, Download, Loader2, MousePointer2, Settings, HelpCircle, Github } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';
import { exportAllSprites } from '../../lib/exportUtils';

const Toolbar: React.FC = () => {
  const {
    mode,
    setMode,
    scale,
    setTransform,
    position,
    setImage,
    imageUrl,
    fileName,
    rects,
    setUI
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleZoom = (direction: 'in' | 'out') => {
    const newScale = direction === 'in' ? scale * 1.2 : scale / 1.2;
    setTransform(newScale, position);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImage(result, img.width, img.height, file.name);
        toast.success(`Loaded ${file.name}`);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleQuickExport = async () => {
    if (!imageUrl || rects.length === 0) {
      toast.error("Nothing to export");
      return;
    }

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

  return (
    <>
      <div className="h-full px-4 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 shrink-0">
          {/* Branding */}
          <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight select-none">
            <Scissors className="w-5 h-5" />
            <span className="hidden sm:inline">SpriteExtract</span>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* File Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Open</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Mode Switcher */}
          <div className="flex bg-muted p-1 rounded-lg shrink-0">
            <button
              onClick={() => setMode('MANUAL')}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                mode === 'MANUAL' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Manual Cut Mode"
            >
              <MousePointer2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Manual</span>
            </button>
            <button
              onClick={() => setMode('GRID')}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                mode === 'GRID' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid Cut Mode"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setMode('AUTO')}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                mode === 'AUTO' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Auto Detect Mode"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Auto</span>
            </button>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-4 shrink-0">

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUI({ isHelpOpen: true })}
              className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Help & Shortcuts"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setUI({ isSettingsOpen: true })}
              className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <button
              onClick={() => handleZoom('out')}
              className="p-1.5 hover:bg-background rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs w-10 text-center font-mono select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => handleZoom('in')}
              className="p-1.5 hover:bg-background rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleQuickExport}
            disabled={rects.length === 0 || isExporting}
            className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Download All"
          >
            {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          </button>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/AlexsdeG/SpriteExtract"
              target="_blank"
              rel="noreferrer"
              className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:bg-white/10"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Toolbar;
