import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import { useStore } from '../../store/useStore';
import { generateSpriteNames } from '../../lib/ai';
import { toast } from 'sonner';
import { Wand2, Loader2, Plus, X, Edit2, MessageSquare, Info, Check, Trash2, Star } from 'lucide-react';
import SpritePreview from '../ui/SpritePreview';

interface AutoNameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReferenceItem {
  id: string;
  name: string;
  comment?: string;
  includeName?: boolean;
}

interface AttributeCategory {
  id: string;
  name: string;
  values: string[];
  color: string;
}

const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
};

interface SpriteAssignments {
  [spriteId: string]: {
    [categoryId: string]: string[];
  };
}

const AutoNameModal: React.FC<AutoNameModalProps> = ({ isOpen, onClose }) => {
  const { rects, imageUrl, updateRect, preferences } = useStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  // Enhanced State
  const [useManualContext, setUseManualContext] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Advanced Grouping State
  // Advanced Grouping State
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Initialize from localStorage or default
  const [namingPattern, setNamingPattern] = useState(() => {
    return localStorage.getItem('spriteExtract_autoName_pattern') || '{Category}_{Name}';
  });
  
  const [categories, setCategories] = useState<AttributeCategory[]>(() => {
    const saved = localStorage.getItem('spriteExtract_autoName_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved categories", e);
      }
    }
    return [
      { id: 'cat_1', name: 'Type', values: ['Weapon', 'Armor', 'Potion'], color: '#ef4444' },
      { id: 'cat_2', name: 'Element', values: ['Fire', 'Ice', 'Void'], color: '#3b82f6' }
    ];
  });

  // Persistence Effects
  React.useEffect(() => {
    localStorage.setItem('spriteExtract_autoName_pattern', namingPattern);
  }, [namingPattern]);

  React.useEffect(() => {
    localStorage.setItem('spriteExtract_autoName_categories', JSON.stringify(categories));
  }, [categories]);

  const [assignments, setAssignments] = useState<SpriteAssignments>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  
  // Editing State
  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editComment, setEditComment] = useState('');
  const [editIncludeName, setEditIncludeName] = useState(true);

  // Filter for sprites that already have names (potential references)
  const namedSprites = useMemo(() => rects.filter(r => r.name && r.name.trim() !== ''), [rects]);

  const handleAddReference = (spriteId: string, name: string) => {
    if (!references.find(r => r.id === spriteId)) {
      setReferences(prev => [...prev, { id: spriteId, name, includeName: true }]);
    }
    setIsPickerOpen(false);
  };

  const handleRemoveReference = (id: string) => {
    setReferences(prev => prev.filter(r => r.id !== id));
  };

  const startEditing = (ref: ReferenceItem) => {
    setEditingRefId(ref.id);
    setEditName(ref.name);
    setEditComment(ref.comment || '');
    setEditIncludeName(ref.includeName !== false);
  };

  const saveEdit = () => {
    if (editingRefId) {
      setReferences(prev => prev.map(r => 
        r.id === editingRefId 
          ? { ...r, name: editName, comment: editComment, includeName: editIncludeName } 
          : r
      ));
      setEditingRefId(null);
    }
  };

  const handleGenerate = async () => {
    if (!imageUrl) return;
    
    setIsGenerating(true);
    setProgress({ current: 0, total: rects.length });

    // 1. Prepare Context Names
    let initialContext: string[] = [];
    if (useManualContext) {
      initialContext = namedSprites.map(r => r.name!);
    }

    // 2. Prepare Reference Sprites
    // Map UI references back to rects
    const referenceSprites = references
      .map(ref => {
        const rect = rects.find(r => r.id === ref.id);
        if (!rect) return null;
        // Append comment to name if present for the AI prompt context
        const nameWithComment = ref.comment ? `${ref.name} (${ref.comment})` : ref.name;
        return { rect, name: nameWithComment, includeName: ref.includeName };
      })
      .filter((r): r is { rect: any, name: string, includeName?: boolean } => r !== null);

    try {
      const names = await generateSpriteNames(
        imageUrl, 
        rects, 
        prompt,
        preferences.geminiApiKey,
        initialContext,
        referenceSprites,
        {
          namingPattern,
          categories,
          assignments
        },
        (current, total) => setProgress({ current, total })
      );
      
      const count = Object.keys(names).length;
      if (count === 0) {
         throw new Error("No names generated. Check API key or limits.");
      }

      // Update rects with new names
      Object.entries(names).forEach(([id, name]) => {
        updateRect(id, { name });
      });
      
      toast.success(`Successfully named ${count} sprites`);
      
      // Reset State on Success
      setReferences([]);
      setUseManualContext(false);
      setPrompt('');
      setShowReferences(false);
      
      onClose();
    } catch (error: any) {
      console.error('Generation failed:', error);
      toast.error(`Generation failed: ${error.message || 'Unknown error'}`, {
        duration: 5000,
        style: { background: '#ef4444', color: 'white', border: 'none' }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Auto-Name Sprites">
      <div className="space-y-6">
        {/* Prompt Section */}
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

        {/* Context Options */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Advanced Context & Grouping</h3>
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all categories and reset settings? This cannot be undone.')) {
                      setCategories([]);
                      setNamingPattern('{Category}_{Name}');
                      setAssignments({});
                      setActiveCategory(null);
                      setActiveValue(null);
                      localStorage.removeItem('spriteExtract_autoName_categories');
                      localStorage.removeItem('spriteExtract_autoName_pattern');
                      toast.success('Settings cleared');
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                  title="Clear all categories and reset settings"
               >
                 <Trash2 className="w-3 h-3" /> Clear All
               </button>
               <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-primary hover:underline"
              >
                {showAdvanced ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {showAdvanced && (
            <div className="space-y-4 border border-border rounded-md p-3 bg-secondary/10">
              {/* Naming Pattern */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Naming Pattern</label>
                <input 
                  value={namingPattern}
                  onChange={(e) => setNamingPattern(e.target.value)}
                  className="w-full px-2 py-1 bg-secondary border border-border rounded text-sm font-mono"
                  placeholder="{Category}_{Attribute}_{Name}"
                />
                <p className="text-[10px] text-muted-foreground">Use placeholders like &#123;Type&#125; matching your categories below.</p>
              </div>

              {/* Categories Manager */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Attribute Categories</label>
                  <button 
                    onClick={() => {
                      const id = `cat_${Date.now()}`;
                      setCategories([...categories, { id, name: 'New Category', values: [], color: getRandomColor() }]);
                      setActiveCategory(id);
                    }}
                    className="text-[10px] flex items-center gap-1 text-primary hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add Category
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${activeCategory === cat.id ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Active Category Editor */}
                {activeCategory && (
                  <div className="mt-2 p-2 bg-secondary/30 rounded border border-border space-y-3">
                    {(() => {
                      const cat = categories.find(c => c.id === activeCategory)!;
                      return (
                        <>
                          <div className="flex gap-2 items-center">
                             <input 
                               type="color"
                               value={cat.color}
                               onChange={(e) => {
                                 setCategories(categories.map(c => c.id === activeCategory ? { ...c, color: e.target.value } : c));
                               }}
                               className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                               title="Group Color"
                             />
                             <input 
                               value={cat.name}
                               onChange={(e) => {
                                 setCategories(categories.map(c => c.id === activeCategory ? { ...c, name: e.target.value } : c));
                               }}
                               className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs"
                               placeholder="Category Name"
                             />
                             <button 
                               onClick={() => {
                                 setCategories(categories.filter(c => c.id !== activeCategory));
                                 setActiveCategory(null);
                               }}
                               className="p-1 text-muted-foreground hover:text-destructive"
                               title="Delete Category"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>

                          {/* Values Management (Chips) */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">Values</label>
                            <div className="flex flex-wrap gap-1.5 p-1 bg-background border border-border rounded min-h-[32px]">
                               {cat.values.map((val, idx) => (
                                 <div key={idx} className="flex items-center gap-1 px-1.5 py-0.5 bg-secondary rounded text-[10px] group border border-transparent hover:border-border">
                                   <input 
                                     className="bg-transparent w-auto min-w-[20px] outline-none"
                                     value={val}
                                     onChange={(e) => {
                                       const newVal = e.target.value;
                                       // Update category value
                                       const newValues = [...cat.values];
                                       newValues[idx] = newVal;
                                       setCategories(categories.map(c => c.id === activeCategory ? { ...c, values: newValues } : c));
                                       
                                       // Sync assignments: Rename old value to new value
                                       setAssignments(prev => {
                                          const next = { ...prev };
                                          Object.keys(next).forEach(spriteId => {
                                            if (next[spriteId][activeCategory]?.includes(val)) {
                                              next[spriteId] = {
                                                ...next[spriteId],
                                                [activeCategory]: next[spriteId][activeCategory].map(v => v === val ? newVal : v)
                                              };
                                            }
                                          });
                                          return next;
                                       });
                                     }}
                                   />
                                   <button 
                                     onClick={() => {
                                       // Remove value
                                       const newValues = cat.values.filter((_, i) => i !== idx);
                                       setCategories(categories.map(c => c.id === activeCategory ? { ...c, values: newValues } : c));
                                       
                                       // Sync assignments: Remove value
                                       setAssignments(prev => {
                                          const next = { ...prev };
                                          Object.keys(next).forEach(spriteId => {
                                            if (next[spriteId][activeCategory]?.includes(val)) {
                                              next[spriteId] = {
                                                ...next[spriteId],
                                                [activeCategory]: next[spriteId][activeCategory].filter(v => v !== val)
                                              };
                                            }
                                          });
                                          return next;
                                       });
                                     }}
                                     className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                   >
                                     <X className="w-3 h-3" />
                                   </button>
                                 </div>
                               ))}
                               <input 
                                 placeholder="+ Add"
                                 className="bg-transparent text-[10px] outline-none min-w-[40px] flex-1"
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     const val = e.currentTarget.value.trim();
                                     if (val && !cat.values.includes(val)) {
                                       setCategories(categories.map(c => c.id === activeCategory ? { ...c, values: [...c.values, val] } : c));
                                       e.currentTarget.value = '';
                                     }
                                   }
                                 }}
                               />
                            </div>
                            <textarea 
                               placeholder="Bulk add values (comma separated)..."
                               className="w-full px-2 py-1 mt-1 bg-background border border-border rounded text-[10px] h-8 resize-y"
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter' && !e.shiftKey) {
                                   e.preventDefault();
                                   const newVals = e.currentTarget.value.split(',').map(v => v.trim()).filter(v => v && !cat.values.includes(v));
                                   if (newVals.length > 0) {
                                      setCategories(categories.map(c => c.id === activeCategory ? { ...c, values: [...c.values, ...newVals] } : c));
                                      e.currentTarget.value = '';
                                   }
                                 }
                               }}
                             />
                          </div>

                          {/* Value Picker for Assignment */}
                          <div className="space-y-1 pt-2 border-t border-border/50">
                             <div className="flex justify-between items-center">
                               <label className="text-[10px] text-muted-foreground font-medium">Assign to Sprites:</label>
                               <button
                                 onClick={() => setActiveValue(activeValue === '__GROUP_ONLY__' ? null : '__GROUP_ONLY__')}
                                 className={`flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border ${activeValue === '__GROUP_ONLY__' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary/50'}`}
                                 title="Assign to Group (No specific value)"
                               >
                                 <Star className="w-3 h-3 fill-current" /> Group Only
                               </button>
                             </div>
                             
                             <div className="flex flex-wrap gap-1">
                               {cat.values.map(val => (
                                 <button
                                   key={val}
                                   onClick={() => setActiveValue(activeValue === val ? null : val)}
                                   className={`px-2 py-0.5 text-[10px] rounded border transition-colors`}
                                   style={{
                                     borderColor: activeValue === val ? cat.color : 'transparent',
                                     backgroundColor: activeValue === val ? `${cat.color}20` : 'transparent',
                                     color: activeValue === val ? cat.color : 'inherit',
                                     borderWidth: '1px',
                                     borderStyle: 'solid'
                                   }}
                                 >
                                   {val}
                                 </button>
                               ))}
                             </div>
                             {activeValue && (
                               <p className="text-[10px] animate-pulse" style={{ color: cat.color }}>
                                 Click sprites below to assign <b>{activeValue === '__GROUP_ONLY__' ? 'Group Only' : activeValue}</b>
                               </p>
                             )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input 
              type="checkbox"
              checked={useManualContext}
              onChange={(e) => setUseManualContext(e.target.checked)}
              disabled={isGenerating}
              className="rounded border-border bg-secondary text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">
              Use existing manual names as context
            </span>
          </label>
        </div>

        {/* Reference Sprites Section */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Reference Sprites (Visual Anchors)</h3>
            <button 
              onClick={() => setShowReferences(!showReferences)}
              className="text-xs text-primary hover:underline"
            >
              {showReferences ? "Hide" : "Show"}
            </button>
          </div>
          
          {showReferences && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Add specific sprites to guide the AI (e.g., "This image is a helm").
              </p>
              
              {/* Reference List */}
              <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                {/* Add Button */}
                <button
                  onClick={() => setIsPickerOpen(true)}
                  className="aspect-square flex flex-col items-center justify-center border border-dashed border-border rounded-md hover:border-primary hover:bg-secondary/50 transition-colors gap-1 group"
                >
                  <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary">Add Ref</span>
                </button>

                {references.map(ref => (
                  <div key={ref.id} className="relative group border border-border rounded-md bg-secondary/20 p-1">
                    {/* Sprite Preview */}
                    <div className="aspect-square w-full relative overflow-hidden rounded-sm bg-checkerboard bg-[length:8px_8px] mb-1">
                       <SpritePreview 
                         imageUrl={imageUrl} 
                         rect={rects.find(r => r.id === ref.id)!} 
                         className="w-full h-full"
                       />
                    </div>
                    
                    {/* Name & Comment Indicator */}
                    <div className={`text-[10px] truncate text-center font-medium px-0.5 ${ref.includeName === false ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground'}`}>
                      {ref.name}
                    </div>
                    {ref.comment && (
                      <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full" title={ref.comment} />
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-md">
                      <button 
                        onClick={() => startEditing(ref)}
                        className="p-1 hover:bg-white/20 rounded text-white"
                        title="Edit / Comment"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleRemoveReference(ref.id)}
                        className="p-1 hover:bg-red-500/50 rounded text-white"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sprite Grid for Assignments (Only visible when Advanced is open) */}
        {showAdvanced && (
          <div className="space-y-2 pt-4 border-t border-border">
             <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-foreground">Sprite Assignments</h3>
                <span className="text-[10px] text-muted-foreground">
                  {activeValue 
                    ? `Click sprites to assign "${activeValue}"` 
                    : "Select a value above to start assigning"}
                </span>
             </div>
             <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1 border border-border rounded-md bg-secondary/10">
                {rects.map(rect => {
                   const isAssigned = activeCategory && activeValue && assignments[rect.id]?.[activeCategory]?.includes(activeValue);
                   
                   // Prepare tooltip content
                   const assignedList = Object.entries(assignments[rect.id] || {}).flatMap(([catId, vals]) => {
                      const cat = categories.find(c => c.id === catId);
                      if (!cat) return [];
                      return (vals as string[]).map(v => ({ cat: cat.name, val: v === '__GROUP_ONLY__' ? 'Group Only' : v }));
                   });
                   const tooltipText = assignedList.length > 0 
                      ? assignedList.map(a => `${a.cat}: ${a.val}`).join('\n') 
                      : "No assignments";

                   return (
                     <button
                       key={rect.id}
                       title={tooltipText} // Simple tooltip for now
                       onClick={() => {
                         if (!activeCategory || !activeValue) return;
                         
                         setAssignments(prev => {
                           const spriteAssigns = prev[rect.id] || {};
                           const catAssigns = spriteAssigns[activeCategory] || [];
                           
                           let newCatAssigns;
                           if (catAssigns.includes(activeValue)) {
                             newCatAssigns = catAssigns.filter(v => v !== activeValue);
                           } else {
                             newCatAssigns = [...catAssigns, activeValue];
                           }
                           
                           return {
                             ...prev,
                             [rect.id]: {
                               ...spriteAssigns,
                               [activeCategory]: newCatAssigns
                             }
                           };
                         });
                       }}
                       className={`relative aspect-square border rounded overflow-hidden group transition-all ${isAssigned ? 'ring-2' : 'border-border hover:border-primary/50'}`}
                       style={{
                         borderColor: isAssigned && activeCategory ? categories.find(c => c.id === activeCategory)?.color : undefined,
                         boxShadow: isAssigned && activeCategory ? `0 0 0 1px ${categories.find(c => c.id === activeCategory)?.color}` : undefined
                       }}
                       disabled={!activeValue}
                     >
                        <div className="absolute inset-0 bg-checkerboard bg-[length:8px_8px] opacity-50" />
                        <SpritePreview 
                          imageUrl={imageUrl} 
                          rect={rect} 
                          className="w-full h-full relative z-10"
                        />
                        
                        {/* Assignment Badges */}
                        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap gap-0.5 p-0.5 z-20 bg-black/60 min-h-[6px]">
                          {Object.entries(assignments[rect.id] || {}).flatMap(([catId, vals]) => {
                             const cat = categories.find(c => c.id === catId);
                             if (!cat) return [];
                             return vals.map(v => (
                               <div 
                                 key={`${catId}-${v}`} 
                                 className="rounded-full flex items-center justify-center"
                                 style={{ 
                                   backgroundColor: cat.color,
                                   width: v === '__GROUP_ONLY__' ? '8px' : '6px',
                                   height: v === '__GROUP_ONLY__' ? '8px' : '6px'
                                 }} 
                                 title={`${cat.name}: ${v === '__GROUP_ONLY__' ? 'Group Only' : v}`}
                               >
                                 {v === '__GROUP_ONLY__' && <Star className="w-[6px] h-[6px] text-white fill-current" />}
                               </div>
                             ));
                          })}
                        </div>
                        
                        {isAssigned && (
                           <div className="absolute inset-0 bg-black/10 z-20 flex items-center justify-center">
                             <Check className="w-5 h-5 drop-shadow-md" style={{ color: activeCategory ? categories.find(c => c.id === activeCategory)?.color : 'white' }} />
                           </div>
                        )}
                     </button>
                   );
                })}
             </div>
          </div>
        )}

        {/* Reference Picker Modal/Overlay */}
        {isPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md max-h-[60vh] flex flex-col">
              <div className="p-3 border-b border-border flex justify-between items-center">
                <h4 className="text-sm font-medium">Select Reference Sprite</h4>
                <button onClick={() => setIsPickerOpen(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 grid grid-cols-4 gap-2">
                {namedSprites.map(sprite => (
                  <button
                    key={sprite.id}
                    onClick={() => handleAddReference(sprite.id, sprite.name!)}
                    className="relative border border-border rounded p-1 hover:border-primary hover:bg-secondary/50 text-left group"
                    disabled={references.some(r => r.id === sprite.id)}
                  >
                     <div className="aspect-square w-full relative overflow-hidden rounded-sm bg-checkerboard bg-[length:8px_8px] mb-1">
                        <SpritePreview 
                          imageUrl={imageUrl} 
                          rect={sprite} 
                          className="w-full h-full"
                        />
                    </div>
                    <div className="text-[10px] truncate font-medium">{sprite.name}</div>
                    {references.some(r => r.id === sprite.id) && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
                {namedSprites.length === 0 && (
                  <div className="col-span-4 text-center py-8 text-muted-foreground text-sm">
                    No named sprites available. Name some sprites manually first.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Reference Modal/Overlay */}
        {editingRefId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm p-4 space-y-4">
              <h4 className="text-sm font-medium">Edit Reference</h4>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={editIncludeName}
                    onChange={(e) => setEditIncludeName(e.target.checked)}
                    className="rounded border-border bg-secondary text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">Include Name in Reference</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Name</label>
                <input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={!editIncludeName}
                  className={`w-full px-2 py-1 bg-secondary border border-border rounded text-sm ${!editIncludeName ? 'opacity-50' : ''}`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Comment (Extra Info for AI)</label>
                <textarea 
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-2 py-1 bg-secondary border border-border rounded text-sm h-20 resize-none"
                  placeholder="e.g. This is a level 1 helm..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setEditingRefId(null)}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveEdit}
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

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
