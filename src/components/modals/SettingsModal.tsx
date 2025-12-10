import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useStore } from '../../store/useStore';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { preferences, setPreferences, resetSettings } = useStore();
  const [showApiKey, setShowApiKey] = useState(false);

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
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Default Naming Prefix</label>
              <input
                type="text"
                value={preferences.defaultNamingPrefix}
                onChange={(e) => setPreferences({ defaultNamingPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. sprite"
              />
            </div>

            {/* AI Settings - Hidden in DEMO mode */}
            {!(import.meta.env.VITE_DEMO || import.meta.env.DEMO) && (
              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-foreground">AI Settings</h3>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Gemini API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={preferences.geminiApiKey || ''}
                      onChange={(e) => setPreferences({ geminiApiKey: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                      placeholder="Enter your Gemini API Key"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      title={showApiKey ? "Hide API Key" : "Show API Key"}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is stored locally in your browser (encrypted).
                  </p>
                </div>
              </div>
            )}
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
