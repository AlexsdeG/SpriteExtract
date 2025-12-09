# SpriteExtract

A professional, browser-based tool for slicing and extracting sprites from texture atlases and spritesheets. Built with React, Konva, and OpenCV.


![App Screenshot](https://github.com/AlexsdeG/SpriteExtract/blob/main/SpriteExtract.png)

## 🚀 Features

### ✂️ Extraction Modes
*   **Manual Mode**: Click and drag to define sprites. Includes aspect ratio locking, overlap prevention, and sprite locking.
*   **Grid Mode**: Slice images into uniform cells.
    *   **Pixel Mode**: Define cells by width/height (e.g., 32x32px).
    *   **Count Mode**: Define grid by rows and columns (e.g., 4x4).
    *   **Interactive**: Click or drag across the grid to select specific cells.
    *   **Generate**: Automatically create sprites for the entire grid.
*   **Auto-Detect**: Uses **Computer Vision (OpenCV)** to automatically find sprites based on transparency.
    *   **Real-time Preview**: Visualize detections before applying.
    *   **Advanced Controls**: Adjust Alpha Threshold, Min Area, Padding, and Margin (dilation).
    *   **Interactive**: Click detected areas to add them selectively.

### 🎨 Canvas & Workspace
*   **Infinite Canvas**: Smooth Pan (Space+Drag) and Zoom (Scroll) navigation.
*   **High Performance**: Efficiently handles hundreds of sprites using HTML5 Canvas (Konva).
*   **Global Settings**: Persisted preferences for naming conventions, grid defaults, and UI options.

### 📦 Management & Export
*   **Sprite Management**: Rename, delete, and focus on specific sprites via the sidebar.
*   **Bulk Export**: Download all extracted sprites as a structured ZIP file.
*   **Individual Export**: Download single sprites as PNGs immediately.
*   **Smart Naming**: Auto-incrementing naming system with custom prefixes.

## 🛠️ Tech Stack

*   **Core**: React 18, TypeScript, Vite
*   **State Management**: Zustand (with local storage persistence)
*   **Canvas Engine**: Konva, React-Konva
*   **Computer Vision**: OpenCV.js (WebAssembly)
*   **Styling**: TailwindCSS, Lucide Icons, Shadcn-like UI principles
*   **Utilities**: JSZip, FileSaver

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18+)
*   pnpm (recommended), npm, or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/sprite-extract.git
    cd sprite-extract
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Run the development server**
    ```bash
    pnpm dev
    ```

4.  **Build for production**
    ```bash
    pnpm build
    ```

## 📁 Project Structure

```text
src/
├── components/
│   ├── canvas/         # Konva stage, layers, grids, and selection logic
│   ├── layout/         # Main application shell and layout grid
│   ├── modals/         # Settings and Help dialogs
│   ├── panels/         # UI regions (Toolbar, Sidebar, ToolOptions, StatusBar)
│   └── ui/             # Reusable UI components
├── hooks/              # Custom hooks (Keyboard shortcuts, OpenCV loader)
├── lib/                # Core logic (Computer Vision, Exporting, Utils)
├── store/              # Global state management via Zustand
└── types.ts            # TypeScript interfaces and settings definitions
```

## ⌨️ Shortcuts

| Key | Action |
| :--- | :--- |
| `Space + Drag` | Pan Canvas |
| `Scroll Wheel` | Zoom In/Out |
| `Delete` | Remove selected sprites |
| `Ctrl + A` | Select all sprites |
| `Shift + Click` | Multi-select sprites |
| `Double Click` | Rename sprite in sidebar |

## 📄 License

Distributed under the MIT License.
