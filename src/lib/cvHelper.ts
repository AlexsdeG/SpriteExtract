
import { SpriteRect } from '../types';

export const detectSprites = (
  imageUrl: string, 
  thresholdVal: number, 
  minArea: number,
  padding: number, // Used for expanding final boxes
  margin: number   // Used for merging via dilation
): Promise<SpriteRect[]> => {
  return new Promise((resolve, reject) => {
    // 1. Create a temporary image to load the source
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      try {
        const cv = window.cv;
        if (!cv) {
          reject(new Error("OpenCV not loaded"));
          return;
        }

        // 2. Read image into OpenCV Mat
        const src = cv.imread(img);
        const gray = new cv.Mat();
        let mask = new cv.Mat();

        // 3. Prepare for thresholding
        const channels = new cv.MatVector();
        cv.split(src, channels);
        
        if (channels.size() === 4) {
             // Image has Alpha.
             const alpha = channels.get(3);
             cv.threshold(alpha, mask, thresholdVal, 255, cv.THRESH_BINARY);
             alpha.delete();
        } else {
            // No Alpha.
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
            cv.threshold(gray, mask, thresholdVal, 255, cv.THRESH_BINARY);
        }

        // 4. Margin logic (Dilation to merge close sprites)
        if (margin > 0) {
            // Kernel size must be positive and odd. 
            // Margin 1 -> Kernel 3x3. Margin 2 -> Kernel 5x5.
            const kernelSize = (margin * 2) + 1;
            const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kernelSize, kernelSize));
            
            // Dilate: Expands the white areas, effectively bridging gaps between close sprites
            cv.dilate(mask, mask, kernel);
            kernel.delete();
        }

        // 5. Find Contours
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        
        cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        const newRects: SpriteRect[] = [];
        
        // 6. Iterate contours and create Rects
        for (let i = 0; i < contours.size(); ++i) {
          const cnt = contours.get(i);
          const rect = cv.boundingRect(cnt);
          
          // Apply padding (Expansion/Shrinking)
          let x = rect.x - padding;
          let y = rect.y - padding;
          let w = rect.width + (padding * 2);
          let h = rect.height + (padding * 2);

          const area = w * h;
          
          if (area >= minArea && w > 0 && h > 0) {
            newRects.push({
              id: crypto.randomUUID(),
              x: x,
              y: y,
              width: w,
              height: h,
              name: `auto_preview_${i}`, // Temporary name, real naming happens on add
              source: 'AUTO',
              selected: false
            });
          }
        }

        // 7. Memory Cleanup (Critical in WASM)
        src.delete();
        gray.delete();
        mask.delete();
        contours.delete();
        hierarchy.delete();
        channels.delete();
        
        resolve(newRects);

      } catch (e) {
        console.error("OpenCV processing failed", e);
        reject(e);
      }
    };
    
    img.onerror = (err) => reject(err);
  });
};
