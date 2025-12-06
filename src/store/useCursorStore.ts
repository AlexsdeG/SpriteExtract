import { create } from 'zustand';

interface CursorState {
  x: number;
  y: number;
  setCursor: (x: number, y: number) => void;
}

// Separated store for high-frequency updates (cursor position)
// This prevents the main App component from re-rendering on every mouse move
export const useCursorStore = create<CursorState>((set) => ({
  x: 0,
  y: 0,
  setCursor: (x, y) => set({ x, y }),
}));