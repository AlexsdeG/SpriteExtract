import React, { useEffect, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import { useStore } from '../../store/useStore';

const ImageLayer: React.FC = () => {
  const imageUrl = useStore((state) => state.imageUrl);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [imageUrl]);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      listening={false} // Don't block interactions
    />
  );
};

export default ImageLayer;