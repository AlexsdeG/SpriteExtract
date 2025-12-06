
import React from 'react';
import Toolbar from '../panels/Toolbar';
import ToolOptions from '../panels/ToolOptions';
import StatusBar from '../panels/StatusBar';
import Sidebar from '../panels/Sidebar';
import CanvasArea from '../canvas/CanvasArea';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useStore } from '../../store/useStore';
import SettingsModal from '../modals/SettingsModal';
import HelpModal from '../modals/HelpModal';

const MainLayout: React.FC = () => {
  // Initialize global keyboard shortcuts
  useKeyboard();
  
  const { ui, setUI } = useStore();

  return (
    <div className="h-screen w-full grid grid-cols-1 md:grid-cols-[1fr_300px] grid-rows-[60px_auto_1fr_30px] overflow-hidden bg-background text-foreground">
      {/* Top Header / Global Toolbar */}
      <header className="col-span-1 md:col-span-2 border-b border-border bg-card z-20">
        <Toolbar />
      </header>

      {/* Contextual Tool Options Bar (Row 2, spans full width until sidebar) */}
      <div className="col-span-1 border-b border-border bg-muted/30 z-10 overflow-hidden">
        <ToolOptions />
      </div>

      {/* Right Sidebar (Row 2-4) */}
      <aside className="hidden md:flex flex-col row-start-2 row-span-3 col-start-2 border-l border-border bg-card overflow-hidden z-20">
        <Sidebar />
      </aside>

      {/* Main Content Area (Canvas) */}
      <main className="relative col-span-1 row-start-3 bg-neutral-900 overflow-hidden">
        <CanvasArea />
      </main>

      {/* Status Bar (Footer) */}
      <footer className="col-span-1 row-start-4 border-t border-border bg-card z-10">
        <StatusBar />
      </footer>

      {/* Modals rendered here to overlay everything */}
      <SettingsModal isOpen={ui.isSettingsOpen} onClose={() => setUI({ isSettingsOpen: false })} />
      <HelpModal isOpen={ui.isHelpOpen} onClose={() => setUI({ isHelpOpen: false })} />
    </div>
  );
};

export default MainLayout;
