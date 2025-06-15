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
  
  useEffect(() => {
    // Reset when src changes
    setImgSrc(src);
    setHasError(false);
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
  
  // Always render the same structure to avoid hydration mismatch
  // Use the original src on first render to match server-side rendering
  const displaySrc = typeof window === 'undefined' ? src : imgSrc;
  
  return (
    <img
      src={displaySrc}
      alt={alt}
      width={width}
      height={height}
      className={`${className} transition-opacity duration-300`}
      onError={handleError}
      style={{ objectFit }}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
};

export default FallbackImage; 