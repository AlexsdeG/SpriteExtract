
export type SelectionMode = 'MANUAL' | 'GRID' | 'AUTO';

export interface Dimensions {
  width: number;
  height: number;
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface SpriteRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  source: SelectionMode;
  selected?: boolean;
}

export interface ManualSettings {
  maintainAspectRatio: boolean;
  aspectRatioX: number;
  aspectRatioY: number;
  preventOverlap: boolean;
  allowPartial: boolean;
  lockSprites: boolean;
}

export interface GridSettings {
  calculationMode: 'PIXEL' | 'COUNT';
  width: number;
  height: number;
  columns: number;
  rows: number;
  offsetX: number;
  offsetY: number;
  padding: number;
  gap: number;
  allowPartial: boolean;
  interactionMode: 'GENERATE' | 'SELECT';
  lockSprites: boolean;
}

export interface AutoSettings {
  threshold: number;
  minArea: number;
  padding: number;
  margin: number;
  allowPartial: boolean;
  interactionMode: 'GENERATE' | 'SELECT';
  lockSprites: boolean;
}

export interface UserPreferences {
  showSidebarThumbnails: boolean;
  defaultNamingPrefix: string;
}

export interface UIState {
  isSettingsOpen: boolean;
  isHelpOpen: boolean;
}
