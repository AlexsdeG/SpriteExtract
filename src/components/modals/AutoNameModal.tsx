import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useStore } from '../../store/useStore';
import { generateSpriteNames } from '../../lib/ai';
import { toast } from 'sonner';
import { Wand2, Loader2 } from 'lucide-react';

interface AutoNameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AutoNameModal: React.FC<AutoNameModalProps> = ({ isOpen, onClose }) => {
  const { rects, imageUrl, updateRect, preferences } = useStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!imageUrl) return;
    
    setIsGenerating(true);
    setProgress({ current: 0, total: rects.length });
    setGeneratedNames([]); // Reset for new generation

    try {
      const names = await generateSpriteNames(
        imageUrl, 
        rects, 
        prompt,
        preferences.geminiApiKey,
        [], // Initial context is empty
        (current, total) => setProgress({ current, total })
      );
      
      // Update rects with new names
      Object.entries(names).forEach(([id, name]) => {
        updateRect(id, { name });
      });
      
      setGeneratedNames(Object.values(names));
      toast.success(`Successfully named ${Object.keys(names).length} sprites`);
      onClose();
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate names');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Auto-Name Sprites">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground block">
            Naming Prompt (Optional)
          </label>
          <p className="text-xs text-muted-foreground/70">
            Describe the sprites or the naming convention you want (e.g., "RPG inventory items, snake_case").
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-24 resize-none"
            placeholder="e.g. Fantasy RPG weapons, use descriptive names like iron_sword, wooden_shield..."
            disabled={isGenerating}
          />
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Processing...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || rects.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Names'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AutoNameModal;
