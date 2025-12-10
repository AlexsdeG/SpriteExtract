import React from 'react';
import Modal from '../ui/Modal';
import { Keyboard, MousePointer2, Grid3X3, Wand2, Star } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Shortcuts" className="max-w-2xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        
        {/* Keyboard Shortcuts */}
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-1">
            <Keyboard className="w-4 h-4" /> Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center bg-muted/50 p-2 rounded">
              <span className="text-muted-foreground">Delete selection</span>
              <kbd className="bg-background border border-border px-2 py-0.5 rounded text-xs font-mono">Delete</kbd>
            </div>
            <div className="flex justify-between items-center bg-muted/50 p-2 rounded">
              <span className="text-muted-foreground">Select All</span>
              <kbd className="bg-background border border-border px-2 py-0.5 rounded text-xs font-mono">Ctrl + A</kbd>
            </div>
            <div className="flex justify-between items-center bg-muted/50 p-2 rounded">
              <span className="text-muted-foreground">Pan Canvas</span>
              <div className="flex gap-1">
                <kbd className="bg-background border border-border px-2 py-0.5 rounded text-xs font-mono">Space</kbd>
                <span className="text-muted-foreground">+</span>
                <span className="text-xs">Drag</span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-muted/50 p-2 rounded">
              <span className="text-muted-foreground">Multi-Select</span>
              <div className="flex gap-1">
                <kbd className="bg-background border border-border px-2 py-0.5 rounded text-xs font-mono">Shift</kbd>
                <span className="text-muted-foreground">+</span>
                <span className="text-xs">Click</span>
              </div>
            </div>
          </div>
        </section>

        {/* Modes Explained */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-foreground border-b border-border pb-1">Extraction Modes</h3>
          
          <div className="grid gap-4">
             <div className="flex gap-3">
                <div className="p-2 bg-muted rounded h-fit"><MousePointer2 className="w-5 h-5 text-blue-400" /></div>
                <div>
                    <h4 className="text-sm font-medium text-foreground">Manual Mode</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Draw boxes manually by clicking and dragging. Hold Shift to maintain aspect ratio if configured. Good for irregular spritesheets.
                    </p>
                </div>
             </div>

             <div className="flex gap-3">
                <div className="p-2 bg-muted rounded h-fit"><Grid3X3 className="w-5 h-5 text-green-400" /></div>
                <div>
                    <h4 className="text-sm font-medium text-foreground">Grid Mode</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Slice the image into uniform cells. Use the toolbar to configure Width, Height, Gap, and Offset. 
                        <br/>
                        <span className="text-primary/80">Interactive Mode:</span> Click specific grid cells to add them.
                        <br/>
                        <span className="text-primary/80">Generate Mode:</span> Automatically add all valid cells.
                    </p>
                </div>
             </div>

             <div className="flex gap-3">
                <div className="p-2 bg-muted rounded h-fit"><Wand2 className="w-5 h-5 text-purple-400" /></div>
                <div>
                    <h4 className="text-sm font-medium text-foreground">Auto-Detect</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Uses Computer Vision to find non-transparent islands in your image. 
                        Adjust <b>Threshold</b> (transparency sensitivity) and <b>Min Area</b> (to ignore small noise particles) for best results.
                    </p>
                </div>
             </div>
          </div>
        </section>

        {/* AI Auto-Naming Explained */}
        <section className="space-y-3">
           <h3 className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-1">
             <Wand2 className="w-4 h-4" /> AI Auto-Naming
           </h3>
           <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                The AI Auto-Name feature uses computer vision to analyze your sprites and generate descriptive names.
              </p>
              
              <div className="grid gap-3">
                 {/* Card 1: Smart Prompting */}
                 <div className="bg-muted/30 p-3 rounded border border-border/50">
                    <h4 className="text-xs font-semibold text-foreground mb-1">1. Smart Prompting</h4>
                    <p className="text-xs mb-2">
                      Guide the AI's style by describing your sprites in the <b>Naming Prompt</b>.
                    </p>
                    <div className="text-[10px] bg-background/50 p-2 rounded border border-border/30 font-mono text-muted-foreground">
                       "Fantasy RPG weapons, use snake_case, e.g. iron_sword"
                    </div>
                 </div>

                 {/* Card 2: Visual References */}
                 <div className="bg-muted/30 p-3 rounded border border-border/50">
                    <h4 className="text-xs font-semibold text-foreground mb-1">2. Visual References</h4>
                    <p className="text-xs mb-2">
                      Teach the AI by example. Select specific sprites to serve as <b>Anchors</b>.
                    </p>
                    <ul className="list-disc list-inside text-xs space-y-1 ml-1">
                       <li><b>Add Ref:</b> Pick a sprite and give it a name (e.g. "Fire Helm").</li>
                       <li><b>Style Guide:</b> The AI will use these examples to name similar looking items consistently.</li>
                    </ul>
                 </div>

                 {/* Card 3: Advanced Grouping */}
                 <div className="bg-muted/30 p-3 rounded border border-border/50">
                    <h4 className="text-xs font-semibold text-foreground mb-1">3. Advanced Grouping & Context</h4>
                    <p className="text-xs mb-2">
                      For complex sheets, use structured naming rules.
                    </p>
                    <ul className="list-disc list-inside text-xs space-y-1 ml-1">
                       <li><b>Categories:</b> Define groups like "Type" or "Element".</li>
                       <li><b>Assignments:</b> Click sprites to tag them with values (e.g. "Fire") or use the <Star className="w-3 h-3 inline align-text-top" /> for generic group membership.</li>
                       <li><b>Pattern:</b> Enforce a structure like <code>&#123;Type&#125;_&#123;Element&#125;_&#123;Name&#125;</code>.</li>
                    </ul>
                 </div>
              </div>
           </div>
        </section>

      </div>
    </Modal>
  );
};

export default HelpModal;
