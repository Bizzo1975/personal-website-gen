'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  const linkRef = useRef<HTMLLinkElement | null>(null);
  
  // Use plain src without cache-busting to improve stability
  const processedSrc = imgSrc;
  
  useEffect(() => {
    // Reset when src changes
    setImgSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);
  
  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      console.warn(`Image failed to load: ${imgSrc}, falling back to: ${fallbackSrc}`);
      setImgSrc(fallbackSrc);
      setHasError(true);
    } else if (hasError) {
      console.error(`Fallback image also failed to load: ${fallbackSrc}`);
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
        const linkId = `preload-${processedSrc.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // Check if link already exists
        let link = document.head.querySelector(`link#${linkId}`) as HTMLLinkElement;
        
        if (!link) {
          link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = processedSrc;
          link.id = linkId;
          document.head.appendChild(link);
          linkRef.current = link;
        }
        
        // Clean up
        return () => {
          if (linkRef.current) {
            try {
              // Only remove if it's still in the DOM
              if (linkRef.current.parentNode === document.head) {
                document.head.removeChild(linkRef.current);
              }
            } catch (e) {
              console.warn('Error removing preload link:', e);
            }
            linkRef.current = null;
          }
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