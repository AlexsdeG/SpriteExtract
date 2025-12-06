import { useState, useEffect } from 'react';

// Declare global window property for OpenCV
declare global {
  interface Window {
    cv: any;
  }
}

export const useOpenCV = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if already loaded
    if (window.cv && window.cv.Mat) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already present but initializing
    const existingScript = document.getElementById('opencv-script');
    if (existingScript) {
      // If script exists, we just wait for cv to be ready
      const checkCv = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          setIsLoaded(true);
          clearInterval(checkCv);
        }
      }, 100);
      return () => clearInterval(checkCv);
    }

    // Inject script
    const script = document.createElement('script');
    script.id = 'opencv-script';
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    
    // Setup callback
    script.onload = () => {
      // OpenCV.js uses onRuntimeInitialized callback
      if (window.cv) {
        window.cv.onRuntimeInitialized = () => {
          setIsLoaded(true);
        };
        // Fallback: sometimes it's already ready without callback
        if (window.cv.Mat) {
            setIsLoaded(true);
        }
      }
    };

    document.body.appendChild(script);

    return () => {
      // We generally don't remove the script as it's a heavy library
    };
  }, []);

  return isLoaded;
};