
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Dimensions, Coordinates, SelectionMode, GridSettings, AutoSettings, ManualSettings, SpriteRect, UserPreferences, UIState } from '../types';

interface AppState {
  // Image State (Not persisted)
  imageUrl: string | null;
  imageDimensions: Dimensions;
  fileName: string | null;

  // Canvas Transform (Not persisted)
  scale: number;
  position: Coordinates;

  // Editor State
  mode: SelectionMode;
  
  // Settings (Persisted)
  gridSettings: GridSettings;
  autoSettings: AutoSettings;
  manualSettings: ManualSettings;
  preferences: UserPreferences;
  
  // UI State (Global for Modals)
  ui: UIState;

  // Data (Not persisted)
  rects: SpriteRect[];
  previewRects: SpriteRect[]; // For Auto Mode preview

  // Actions
  setImage: (url: string, width: number, height: number, name: string) => void;
  setTransform: (scale: number, position: Coordinates) => void;
  setMode: (mode: SelectionMode) => void;
  
  setGridSettings: (settings: Partial<GridSettings>) => void;
  setAutoSettings: (settings: Partial<AutoSettings>) => void;
  setManualSettings: (settings: Partial<ManualSettings>) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  setUI: (ui: Partial<UIState>) => void;
  resetSettings: () => void;
  
  // Rect Actions
  addRect: (rect: SpriteRect) => void;
  addRects: (rects: SpriteRect[]) => void;
  setPreviewRects: (rects: SpriteRect[]) => void;
  updateRect: (id: string, changes: Partial<SpriteRect>) => void;
  removeRect: (id: string) => void;
  selectRect: (id: string | null) => void;
  toggleSelectRect: (id: string) => void;
  selectAll: () => void;
  removeSelected: () => void;
  clearRects: () => void;
}

const defaultGridSettings: GridSettings = { 
  calculationMode: 'PIXEL',
  width: 32, 
  height: 32,
  columns: 4,
  rows: 4,
  offsetX: 0, 
  offsetY: 0, 
  padding: 0, 
  gap: 0,
  allowPartial: false,
  interactionMode: 'GENERATE',
  lockSprites: false
};

const defaultAutoSettings: AutoSettings = { 
  threshold: 10, 
  minArea: 100,
  padding: 0,
  margin: 0,
  allowPartial: false,
  interactionMode: 'GENERATE',
  lockSprites: false
};

const defaultManualSettings: ManualSettings = {
  maintainAspectRatio: false,
  aspectRatioX: 1,
  aspectRatioY: 1,
  preventOverlap: false,
  allowPartial: false,
  lockSprites: false
};

const defaultPreferences: UserPreferences = {
  showSidebarThumbnails: true,
  defaultNamingPrefix: 'sprite'
};

const defaultUI: UIState = {
  isSettingsOpen: false,
  isHelpOpen: false
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      imageUrl: null,
      imageDimensions: { width: 0, height: 0 },
      fileName: null,

      scale: 1,
      position: { x: 0, y: 0 },

      mode: 'MANUAL',
      
      gridSettings: defaultGridSettings,
      autoSettings: defaultAutoSettings,
      manualSettings: defaultManualSettings,
      preferences: defaultPreferences,
      ui: defaultUI,

      rects: [],
      previewRects: [],

      setImage: (url, width, height, name) => set({
        imageUrl: url,
        imageDimensions: { width, height },
        fileName: name,
        scale: 1,
        position: { x: 0, y: 0 }, // Reset view
        rects: [], // Clear previous sprites
        previewRects: []
      }),

      setTransform: (scale, position) => set({ scale, position }),
      setMode: (mode) => set((state) => {
        // When switching modes, deselect all rects from other modes
        const newRects = state.rects.map(r => ({ ...r, selected: false }));
        return { mode, rects: newRects };
      }),
      
      setGridSettings: (settings) => set((state) => ({
        gridSettings: { ...state.gridSettings, ...settings }
      })),
      
      setAutoSettings: (settings) => set((state) => ({
        autoSettings: { ...state.autoSettings, ...settings }
      })),

      setManualSettings: (settings) => set((state) => ({
        manualSettings: { ...state.manualSettings, ...settings }
      })),

      setPreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),

      setUI: (ui) => set((state) => ({
        ui: { ...state.ui, ...ui }
      })),

      resetSettings: () => set({
        gridSettings: defaultGridSettings,
        autoSettings: defaultAutoSettings,
        manualSettings: defaultManualSettings,
        preferences: defaultPreferences
      }),

      addRect: (rect) => set((state) => ({ 
        rects: [...state.rects.map(r => ({ ...r, selected: false })), { ...rect, selected: true }] 
      })),

      addRects: (newRects) => set((state) => ({
        rects: [...state.rects.map(r => ({ ...r, selected: false })), ...newRects]
      })),

      setPreviewRects: (rects) => set({ previewRects: rects }),

      updateRect: (id, changes) => set((state) => ({
        rects: state.rects.map((r) => r.id === id ? { ...r, ...changes } : r)
      })),

      removeRect: (id) => set((state) => ({
        rects: state.rects.filter((r) => r.id !== id)
      })),

      selectRect: (id) => set((state) => ({
        rects: state.rects.map((r) => {
           if (r.id === id) return { ...r, selected: true };
           return { ...r, selected: false };
        })
      })),

      toggleSelectRect: (id) => set((state) => ({
        rects: state.rects.map((r) => r.id === id ? { ...r, selected: !r.selected } : r)
      })),

      selectAll: () => set((state) => ({
        // Only select rects belonging to current mode
        rects: state.rects.map(r => ({ ...r, selected: r.source === state.mode ? true : r.selected }))
      })),

      removeSelected: () => set((state) => ({
        rects: state.rects.filter(r => !r.selected)
      })),

      clearRects: () => set({ rects: [] }),
    }),
    {
      name: 'sprite-extract-storage',
      partialize: (state) => ({
        gridSettings: state.gridSettings,
        autoSettings: state.autoSettings,
        manualSettings: state.manualSettings,
        preferences: state.preferences,
      }),
    }
  )
);
