# Implementation Plan: Spritesheet Cutter

## Phase 1: Project Skeleton & UI Shell
**Goal:** Initialize the app, install deps, and create the layout structure.

1.  **Scaffold Project:**
    *   `pnpm create vite@latest sprite-cutter --template react-ts`
    *   Install generic deps: `pnpm add zustand clsx tailwind-merge lucide-react uuid sonner`.
    *   Install UI/Styling: `pnpm add -D tailwindcss postcss autoprefixer`. Initialize Tailwind.

2.  **Layout Components:**
    *   Create `src/components/layout/MainLayout.tsx`.
    *   Implement CSS Grid: Sidebar (300px right), Header (60px top), Main Content (rest).
    *   Create empty placeholders: `<Toolbar />`, `<CanvasArea />`, `<Sidebar />`.
    *   Add `Toaster` from `sonner` to the root.

## Phase 2: Core Canvas & Image Loading
**Goal:** Get an image on screen, zoom it, and pan it using Konva.

1.  **Install Konva:**
    *   `pnpm add konva react-konva`.
    *   `pnpm add -D canvas` (if testing is needed, optional).

2.  **Zustand Store (`useStore.ts`):**
    *   Create store with slices: `imageSource` (string/URL), `dimensions` {w,h}, `scale` (number), `position` {x,y}.
    *   Action: `loadImage(file)` -> FileReader -> set state.

3.  **Canvas Setup (`EditorCanvas.tsx`):**
    *   Implement `<Stage>` and `<Layer>`.
    *   Implement `<Image>` component referencing state.
    *   **Zoom Logic:** Attach `onWheel` to Stage. Calculate new scale based on pointer position (math: `newScale = oldScale * scaleBy`).
    *   **Pan Logic:** Use `draggable` prop on Stage (or a wrapper Group).

## Phase 3: Manual Slicing & Rect Management
**Goal:** Allow user to draw boxes and see them listed.

1.  **Rect Store Slice:**
    *   Add `rects: SpriteRect[]` to Zustand.
    *   `SpriteRect` = `{ id: string, x, y, width, height, name, selected }`.
    *   Actions: `addRect`, `updateRect`, `removeRect`, `selectRect`.

2.  **Drawing Interaction:**
    *   In `EditorCanvas`, track `onMouseDown`, `onMouseMove`, `onMouseUp`.
    *   *Logic:* If Mode === Manual:
        *   Down: Create temp rect at pointer `{x, y, w:0, h:0}`.
        *   Move: Update temp rect width/height.
        *   Up: Commit temp rect to `rects` array in store.

3.  **Visualizing Rects:**
    *   Create `SelectionLayer.tsx`. Map `rects` to `<Rect>` Konva components.
    *   Add `<Transformer>` component. Attach it to the currently `selected` rect ref.
    *   *Crucial:* Ensure Transformer updates the rect in the store on `onTransformEnd` and `onDragEnd`.

4.  **Sidebar Integration:**
    *   Map `rects` in `<Sidebar />`.
    *   Hovering list item -> Highlights rect on canvas (store action).
    *   Clicking delete -> Removes from store.

## Phase 4: Grid Mode
**Goal:** Generate rects mathematically.

1.  **Toolbar Grid Settings:**
    *   Add inputs for `Grid Width`, `Height`, `Spacing`, `Offset`.
    *   Store these settings in Zustand `gridSettings`.

2.  **Grid Overlay (Visual Helper):**
    *   Create `<GridOverlay />` in Konva. Draw lines based on settings (light opacity).

3.  **"Cut to Grid" Action:**
    *   Button: "Generate Sprites".
    *   Logic: Loop X/Y based on settings. Check if rect is within image bounds.
    *   **Bulk Add:** Push all generated rects to `rects` array in store.

## Phase 5: Auto-Detection (OpenCV)
**Goal:** The "Magic" button.

1.  **OpenCV Setup:**
    *   `pnpm add @techstark/opencv-js`.
    *   Create `useOpenCV` hook. Load the WASM file from `node_modules` or CDN via script tag injection. Return `isLoaded` state.

2.  **Detection Logic (`lib/cvHelper.ts`):**
    *   Function `detectSprites(imgElement, threshold, minArea)`.
    *   Steps:
        *   `cv.imread(imgElement)`.
        *   `cv.cvtColor` (RGB to Gray).
        *   `cv.threshold` (Binary invert usually works best for sprites).
        *   `cv.findContours`.
        *   Loop contours -> `cv.boundingRect(contour)`.
        *   Return array of clean JS objects.
        *   `contour.delete()`, `mat.delete()` (Memory management is vital in OpenCV!).

3.  **UI Integration:**
    *   Toolbar: Show "Auto" tab only when `useOpenCV` is ready.
    *   Run button triggers logic -> `sonner.toast("Found 50 sprites")` -> updates Store.

## Phase 6: Export & Polish
**Goal:** Get the files out.

1.  **Export Logic (`lib/exportUtils.ts`):**
    *   `pnpm add jszip file-saver`.
    *   Function `exportSprites(image, rects, format)`:
        *   Create `new JSZip()`.
        *   Loop rects. Create temp `<canvas>` for each.
        *   `ctx.drawImage` with clipping args.
        *   `canvas.toBlob`.
        *   `zip.file(name, blob)`.
        *   `zip.generateAsync` -> `saveAs`.

2.  **Sidebar Refinement:**
    *   Add "Download" button next to each item (single export).
    *   Add "Download All" in footer.

3.  **Final Polish:**
    *   Keyboard shortcuts: `Delete` key removes selection. `Ctrl+A` selects all.
    *   Empty states: "Upload an image to start".
    *   Loading spinners for OpenCV and Zip generation.

## Phase 7: Layout V2 & UI Restructure
**Goal:** Improve layout for scalability and fix display issues.

1.  **Layout Refactor (`MainLayout.tsx`):**
    *   Update Grid layout to support a Secondary Toolbar row.
    *   Add a fixed `StatusBar` footer at the bottom.

2.  **Tool Options Bar (`ToolOptions.tsx`):**
    *   Create a new component beneath the main Header.
    *   Move context-specific controls (Grid inputs, Auto sliders) from the main Header to this new bar.
    *   **Responsiveness:** Ensure controls wrap or scroll on smaller screens.
    *   Display Manual Mode options here as well (even if currently empty, prep for Phase 9).

3.  **Infinite Canvas Background:**
    *   Refactor the CSS checkerboard background. Instead of relying on a `div` that scales (which creates edges when zooming out), apply the pattern to the container or use a `Konva.Rect` with a `fillPatternImage` that moves inversely to the stage transform to simulate an infinite floor.

4.  **Status Bar Information:**
    *   Display loaded image metadata in the footer:
        *   Dimensions (Width x Height).
        *   File Name & Type.
        *   Cursor Coordinates (Mouse X/Y mapped to image space).

## Phase 8: Settings, Persistence & User Help
**Goal:** Make the app persistent and user-friendly.

1.  **LocalStorage Integration:**
    *   Create a middleware or subscription in `useStore` to persist:
        *   `gridSettings`
        *   `autoSettings`
        *   `preferences` (new slice)
    *   Load these values on app hydration.

2.  **Settings Modal:**
    *   Add "Settings" (Cog icon) in Top Left.
    *   **Content:**
        *   *General:* "Show Sidebar Thumbnails" (toggle), "Default Naming Prefix".
        *   *Behaviors:* "Prevent Rect Overlap" (Manual Mode).
        *   *Reset:* Button to "Reset All Settings to Default".

3.  **Help Modal:**
    *   Add "?" icon in Top Left.
    *   Display Keybinds: `Delete`, `Ctrl+A`, `Space+Drag`, `Ctrl+Z` (future).
    *   Explain Modes: Manual vs Grid vs Auto.
    *   also explain settings

4.  **Sidebar Enhancements:**
    *   **Inline Rename:** Allow double-clicking sprite names to rename them.
    *   **Thumbnails:** Toggle actual image previews in the list (controlled by Settings).

## Phase 9: Mode Isolation & Advanced Logic
**Goal:** Segregate rects by mode and add "Power User" features.

0. General
    *   add the lock feature to all modes. and also separete into one for resize and one for move, add this to all modes manual, grid and auto. so you can in all modes edit and move the grid items when note locked.
    *   also add the partial to all modes, so you can set if you can draw/edit/move rect outside the image or not
    *   update auto to be like grid and pre show what the detect would find. here make it autorun after changing the settings of auto in the toolbar. here if you change the threshold eg it would once run and detect all sprites and show a light grey box around like grid does. this is a preview so the users knows what he can expect. exspiacaly with the new padding/margin to preview how this will affect and look in the spritesheet.
    *   critical: in interactive mode eg for grid use the prerendered grid to allow to click inside the rects. in auto mode it should use the predisplayed auto detect to check if clicked inside a rect, add it to sprites
    *   update preview in sprites sidebar to also have the same aspect ratio or maybe make everything else black cuse currently they show stuff in the preview that would not be used in the cut sprite. fix so in the small space or the img container is set to the aspect ratio of the rect in canvas.

1.  **Mode Segregation:**
    *   Update `SpriteRect` interface: Add `source: 'MANUAL' | 'GRID' | 'AUTO'`.
    *   **Visibility Logic:** Update `SelectionLayer`.
        *   If Mode == Manual, show Manual rects.
        *   If Mode == Grid, show Grid rects.
        *   If Mode == Auto, show Auto rects.
    *   **Selection Logic:** Ensure "Select All" only selects visible rects.
    *   **Switching:** When switching modes, "reset" the view (visually hide other modes' rects).

2.  **Advanced Grid Tools:**
    *   **Partial Cells:** Add checkbox in Tool Options: "Allow Grid to extend past image bounds".
    *   **Selection Workflow:** Add toggle "Generate All" vs "Select Mode".
        *   *Select Mode:* Clicking the grid overlay *adds* that specific cell to the sprite list (instead of generating 100s at once).
    *    Interactive implement this mode. currently cant be selected from the buttons in the toolbar. here implement the interactive fully
    *   **Drag Select:** Allow dragging a box over the grid overlay to bulk-select cells.
    *   **Lock Grid:** Toggle to prevent moving/resizing grid-generated sprites (Rects become read-only transforms).
    *   Add best fit button which calcs the best settings for the grid to fit all elements and fit with the aspect ratio and dividing height width. also maybe some extra options eg if you know the width and height and i enter row and column number than it also can detect the grid.

3.  **Advanced Auto Tools:**
    *   **Padding/Margin:** Add inputs for `padding` (expand box) and `margin` (merge close boxes).
    *   **Constraints:** Checkbox for "Fixed Aspect Ratio" or "Fixed Height" applied to detected contours.
    *   **Workflow:** Separate "Detect" (preview blue lines) from "Add to List" (commit to store).
    *    Here also add a Auto-Gen and Interactive button switch to either detect all elemnts and add them automaticly or like grid have interactive mode where you can select which ones to add to sprites sidebar
    *   add the lock feature
    *   also add the partial

4.  **Advanced Manual Tools:**
    *   **Constraints:** Add "Fixed Ratio" (e.g., 1:1) and "Fixed Size" inputs in Tool Options. With better ui to allow also like 16:9
    *   **Collision:** Implement "Don't Overlap" logic during drag/resize (if enabled in settings).
    *    add the lock feature
    *   also add the partial

## Phase 10: Final Polish
**Goal:** Optimization and Bug Fixing.

1.  **Performance:**
    *   Optimize `Sidebar` with `react-window` if sprite count > 1000.
    *   Use `Konva.FastLayer` for static elements.

2.  **Visual Polish:**
    *   Ensure all icons have tooltips.
    *   Add "Copied!" feedback when clicking coordinates.
    *   Refine colors for "Manual" vs "Grid" vs "Auto" rects (alsways same colors for the modes. gray: if not selected, grid or auto detect in interactive mode. green when added to sprites sidebar either manal,  auto gen or interactive mode in manual grid and auto. yellow when selected to pan transform, or selected in sprites sidebar.
