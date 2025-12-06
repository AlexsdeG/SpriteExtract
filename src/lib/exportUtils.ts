import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { SpriteRect } from '../types';

export const exportSprite = async (
  imageSource: string,
  rect: SpriteRect,
  fileName?: string
) => {
  try {
    const blob = await getSpriteBlob(imageSource, rect);
    if (blob) {
      // Handle different CommonJS/ESM bundle structures for FileSaver
      const save = (FileSaver as any).saveAs || FileSaver;
      save(blob, fileName || `${rect.name}.png`);
      return true;
    }
  } catch (error) {
    console.error(error);
  }
  return false;
};

export const exportAllSprites = async (
  imageSource: string,
  rects: SpriteRect[],
  zipName: string = 'sprites.zip'
) => {
  const zip = new JSZip();
  const folder = zip.folder("sprites");

  // Create promises for all blobs
  const promises = rects.map(async (rect) => {
    const blob = await getSpriteBlob(imageSource, rect);
    if (blob) {
      folder?.file(`${rect.name}.png`, blob);
    }
  });

  await Promise.all(promises);
  
  const content = await zip.generateAsync({ type: "blob" });
  const save = (FileSaver as any).saveAs || FileSaver;
  save(content, zipName);
};

// Helper to extract blob from image
const getSpriteBlob = (imageSource: string, rect: SpriteRect): Promise<Blob | null> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSource;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(
        img,
        rect.x, rect.y, rect.width, rect.height, // Source
        0, 0, rect.width, rect.height            // Dest
      );

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    };
    
    img.onerror = (err) => {
      console.error("Failed to load image for export", err);
      resolve(null);
    };
  });
};