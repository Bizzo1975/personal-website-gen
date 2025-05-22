'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  blur?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 800,
  height = 500,
  className = '',
  priority = false,
  quality = 85,
  objectFit = 'cover',
  blur = false,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isError, setIsError] = useState<boolean>(false);
  const placeholderSrc = '/images/projects/placeholder.jpg';
  
  // Reset the image source when the src prop changes
  useEffect(() => {
    setImgSrc(src);
    setIsError(false);
  }, [src]);

  // Always use standard img tag in development to avoid Next.js image optimization issues
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const handleError = () => {
    console.warn(`Image failed to load: ${imgSrc}`);
    setIsError(true);
    setImgSrc(placeholderSrc);
  };

  // Use a standard img tag for simplicity in development or if there was an error
  return (
    <img
      src={isError ? placeholderSrc : imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${blur ? 'blur-sm hover:blur-none transition-all duration-500' : ''}`}
      style={{ objectFit }}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default OptimizedImage; 