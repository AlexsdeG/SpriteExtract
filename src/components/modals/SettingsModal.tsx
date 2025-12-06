import React from 'react';
import Modal from '../ui/Modal';
import { useStore } from '../../store/useStore';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { preferences, setPreferences, resetSettings } = useStore();

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings to defaults?")) {
      resetSettings();
      toast.success("Settings reset to defaults");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        
        {/* Appearance */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-foreground border-b border-border pb-1">Appearance</h3>
          <div className="flex items-center justify-between">
            <label htmlFor="thumbnails" className="text-sm text-muted-foreground">Show Sidebar Thumbnails</label>
            <input 
              id="thumbnails"
              type="checkbox"
              checked={preferences.showSidebarThumbnails}
              onChange={(e) => setPreferences({ showSidebarThumbnails: e.target.checked })}
              className="rounded border-input bg-secondary text-primary focus:ring-primary"
            />
          </div>
        </section>

        {/* Behavior */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-foreground border-b border-border pb-1">Defaults</h3>
          <div className="space-y-2">
            <label htmlFor="prefix" className="text-sm text-muted-foreground block">Default Sprite Prefix</label>
            <input 
              id="prefix"
              type="text"
              value={preferences.defaultNamingPrefix}
              onChange={(e) => setPreferences({ defaultNamingPrefix: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. sprite"
            />
          </div>
        </section>

        {/* Actions */}
        <section className="pt-4 border-t border-border">
          <button 
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-md text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Settings
          </button>
        </section>

      </div>
    </Modal>
  );
};

export default SettingsModal;
