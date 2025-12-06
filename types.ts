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
  selected?: boolean;
}

export interface GridSettings {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  padding: number;
  gap: number;
}

export interface AutoSettings {
  threshold: number;
  minArea: number;
}