'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
  placeholderType?: 'blur' | 'empty' | 'color';
  placeholderColor?: string;
  className?: string;
  imgClassName?: string;
  aspectRatio?: number;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  placeholderType = 'empty',
  placeholderColor = '#f3f4f6', // Light gray default
  className,
  imgClassName,
  aspectRatio,
  ...rest
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Handle image load complete
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Generate inline styles for aspect ratio container if provided
  const containerStyle: React.CSSProperties = {};
  if (aspectRatio) {
    containerStyle.paddingBottom = `${(1 / aspectRatio) * 100}%`;
  }

  return (
    <div 
      className={cn(
        'relative overflow-hidden', 
        aspectRatio && 'w-full h-0',
        className
      )}
      style={containerStyle}
    >
      {/* Show placeholder while loading */}
      {isLoading && placeholderType === 'color' && (
        <div 
          className="absolute inset-0 z-0 animate-pulse"
          style={{ backgroundColor: placeholderColor }}
        />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoadingComplete={handleLoadingComplete}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          imgClassName
        )}
        placeholder={placeholderType === 'blur' ? 'blur' : 'empty'}
        blurDataURL={placeholderType === 'blur' ? 
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4=' : 
          undefined}
        {...rest}
      />
    </div>
  );
} 