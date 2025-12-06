# Project Knowledge Base: Advanced Spritesheet Cutter

## 1. Project Overview
A browser-based, client-side Single Page Application (SPA) for slicing sprite sheets. It features an infinite canvas with zoom/pan, three extraction modes (Manual, Grid, Auto-Detection via OpenCV), and a sidebar for sprite management.

## 2. Tech Stack & Libraries

### Core Framework
*   **Runtime/Build:** Node.js (v18+), pnpm, Vite (React-TS template).
*   **Framework:** React 18+.
*   **Language:** TypeScript (Strict mode).

### Critical Libraries
| Category | Library | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Engine** | `konva`, `react-konva` | Latest | High-performance 2D canvas, object selection, layering, and coordinate mapping. |
| **State Management** | `zustand` | Latest | Global state for managing the sprite list, canvas transform, and settings. |
| **Computer Vision** | `@techstark/opencv-js` | Latest | WebAssembly version of OpenCV for "Auto" mode (contour detection). |
| **Notifications** | `sonner` | Latest | Beautiful, stackable toast notifications for actions (e.g., "Auto-detect found 45 sprites"). |
| **Export/Compression** | `jszip`, `file-saver` | Latest | Bundling individual cutouts into a ZIP archive. |
| **Icons** | `lucide-react` | Latest | UI icons (Scissors, Grid, Zoom, Trash, etc.). |
| **Styling** | `tailwindcss` | Latest | Utility-first CSS. |
| **UI Components** | `shadcn/ui` (or Radix) | - | Sliders, Switches, Popovers, ScrollAreas for the sidebar. |
| **ID Gen** | `uuid` | Latest | Unique IDs for sprite rects. |

## 3. Directory Structure
```text
/src
├── assets/             # Static assets (worker scripts)
├── components/
│   ├── canvas/         # Konva related components
│   │   ├── EditorCanvas.tsx    # Main Stage/Layer wrapper
│   │   ├── ImageLayer.tsx      # The base sprite sheet image
│   │   ├── SelectionLayer.tsx  # The manual/auto generated rects
│   │   ├── GridOverlay.tsx     # Visual grid lines
│   │   └── Transformer.tsx     # Resize handles for selected rect
│   ├── panels/         # UI Regions
│   │   ├── Toolbar.tsx         # Top bar (Tools, Zoom, Settings)
│   │   ├── Sidebar.tsx         # Right side (Sprite list)
│   │   └── SpriteItem.tsx      # Individual list item
│   └── ui/             # Reusable UI (Buttons, Sliders - Shadcn)
├── hooks/
│   ├── useCanvasScale.ts       # Logic for zooming/panning
│   ├── useOpenCV.ts            # Async loader for OpenCV wasm
│   └── useKeyboard.ts          # Hotkeys (Del, Ctrl+Z)
├── lib/
│   ├── cvHelper.ts     # OpenCV logic (thresholding, contours)
│   └── exportUtils.ts  # Canvas slicing & Zip generation
├── store/
│   └── useStore.ts     # Zustand store (Rects, Image, Selection)
└── App.tsx             # Main Layout Grid
```

## 4. Feature Specifications

### A. The Workspace (Left Region)
**1. Toolbar (Top):**
*   **File Controls:** "Open Image" (File Input), "Export" (Dropdown: ZIP/Individual).
*   **Mode Switcher:** Segmented Control [Manual | Grid | Auto].
*   **Contextual Settings:**
    *   *Grid Mode:* Inputs for Width, Height, Offset X/Y, Padding, Gap.
    *   *Auto Mode:* Slider for Threshold (0-255), Min-Area (remove noise). Button: "Run Auto-Detect".
    *   *Manual Mode:* Info display "Click and drag to cut".
*   **View Controls:** Zoom In/Out buttons, Fit to Screen, background color toggle (Dark/Light/Checkerboard).

**2. Canvas (Center):**
*   **Infinite Canvas:** powered by `Konva.Stage`.
*   **Interactions:**
    *   **Pan:** Middle-click drag OR Spacebar + Drag.
    *   **Zoom:** Mouse wheel (centers on pointer).
    *   **Draw:** (Manual Mode) Left-click drag creates a `Rect`.
    *   **Select:** Click existing `Rect` to focus.
    *   **Modify:** Drag corners to resize (via `Konva.Transformer`).
*   **Visuals:**
    *   Rects have a distinct border color (e.g., Cyan).
    *   Selected Rect has a secondary color (e.g., Yellow) + Resize handles.
    *   Hovering a Rect changes cursor.

### B. The Inspector (Right Region)
*   **Sprite List:** A virtualized list (for performance with 500+ sprites).
*   **Item Details:**
    *   Thumbnail preview of the cut area.
    *   Input field to rename sprite (defaults to `sprite_0`, `sprite_1`).
    *   "Focus" button (pans canvas to that sprite).
    *   "Delete" button (X).
*   **Footer Actions:**
    *   "Clear All" (Destructive, requires confirmation).
    *   "Download Selected" vs "Download All".

### C. Algorithms

**1. Auto-Detection (OpenCV):**
*   **Workflow:**
    1.  Convert Source Image to Grayscale `cv.cvtColor`.
    2.  Apply Threshold `cv.threshold` (to separate sprite from background).
    3.  Find Contours `cv.findContours`.
    4.  Calculate Bounding Rect `cv.boundingRect` for each contour.
    5.  Filter results (ignore rects smaller than `minArea`).
    6.  Convert OpenCV Rects `{x,y,w,h}` to Zustand Rects.

**2. Grid Generation:**
*   **Logic:** Nested Loop.
    ```typescript
    for (y = offY; y < imgH; y += (h + gap))
      for (x = offX; x < imgW; x += (w + gap))
        push({ x, y, w, h })
    ```

**3. Export:**
*   Create an off-screen HTML5 Canvas.
*   Loop through selected Rects.
*   Resize canvas to `rect.w, rect.h`.
*   `ctx.drawImage(source, rect.x, rect.y, ...)`
*   `canvas.toBlob()` -> Add to JSZip instance.

## 5. UI Layout (Grid System)
The App should use a CSS Grid layout:
```css
.app-container {
  display: grid;
  grid-template-columns: 1fr 300px; /* Canvas | Sidebar */
  grid-template-rows: 60px 1fr;     /* Toolbar | Content */
  height: 100vh;
}
/* Toolbar spans full width or just left column, design choice.
   Let's make Toolbar span the Left Column only to keep Sidebar independent. */
```