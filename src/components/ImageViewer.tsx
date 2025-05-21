import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageViewerProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  
  // Handle escape key to close the viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Prevent scrolling on body when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={zoomIn}
          className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors text-white"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-6 w-6" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors text-white"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-6 w-6" />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors text-white"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <div 
        className="w-full h-full flex items-center justify-center overflow-auto p-4"
        onClick={onClose}
      >
        <img 
          src={imageUrl} 
          alt={alt} 
          className="max-w-full max-h-full object-contain cursor-zoom-out"
          style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-in-out' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default ImageViewer;