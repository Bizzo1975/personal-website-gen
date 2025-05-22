'use client';

import React, { useState, useEffect } from 'react';

interface FallbackImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
}

/**
 * A simple image component that handles errors and falls back to a placeholder
 * This is useful in development mode where Next.js Image optimization might cause issues
 */
const FallbackImage: React.FC<FallbackImageProps> = ({
  src,
  alt,
  width = 'auto',
  height = 'auto',
  className = '',
  fallbackSrc = '/images/placeholder-image.png',
  objectFit = 'cover',
  priority = false,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  // Use plain src without cache-busting to improve stability
  const processedSrc = imgSrc;
  
  useEffect(() => {
    // Reset when src changes
    setImgSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);
  
  const handleError = () => {
    if (!hasError) {
      console.warn(`Image failed to load: ${imgSrc}`);
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };
  
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  // Preload image to check if it exists before rendering
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasError) {
      // For priority images, create a high priority image preload
      if (priority) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = processedSrc;
        document.head.appendChild(link);
        
        // Clean up
        return () => {
          document.head.removeChild(link);
        };
      }
      
      // Standard image preload
      const img = new Image();
      img.src = processedSrc;
      img.onload = () => {
        // Image loaded successfully
        setIsLoaded(true);
      };
      img.onerror = () => {
        handleError();
      };
    }
  }, [processedSrc, hasError, priority]);
  
  return (
    <>
      {!isLoaded && (
        <div 
          className={`${className} bg-slate-200 dark:bg-slate-700 animate-pulse`}
          style={{ width, height }}
        />
      )}
      <img
        src={processedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        style={{ objectFit }}
        loading={priority ? 'eager' : 'lazy'}
      />
    </>
  );
};

export default FallbackImage; 