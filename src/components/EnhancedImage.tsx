'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

// Generate a blur data URL for any image
const generateBlurDataURL = (width = 10, height = 10): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Create a simple gradient blur placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(0.5, '#e5e7eb');
  gradient.addColorStop(1, '#d1d5db');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

// Check if image is in viewport using Intersection Observer
const useIntersectionObserver = (
  elementRef: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [elementRef, options]);
  
  return isIntersecting;
};

const EnhancedImage: React.FC<EnhancedImageProps> = ({
  src,
  alt,
  width = 'auto',
  height = 'auto',
  className = '',
  fallbackSrc = '/images/placeholder-image.png',
  objectFit = 'cover',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  quality = 85,
  onLoad,
  onError,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(priority ? src : '');
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentBlurDataURL, setCurrentBlurDataURL] = useState<string>('');
  
  const imgRef = useRef<HTMLDivElement>(null);
  const isInViewport = useIntersectionObserver(imgRef);
  
  // Generate blur placeholder on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && placeholder === 'blur' && !blurDataURL) {
      setCurrentBlurDataURL(generateBlurDataURL());
    } else if (blurDataURL) {
      setCurrentBlurDataURL(blurDataURL);
    }
  }, [blurDataURL, placeholder]);
  
  // Load image when in viewport (lazy loading)
  useEffect(() => {
    if ((isInViewport || priority) && !imgSrc && !hasError) {
      setIsLoading(true);
      
      // Preload image to check if it exists
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setImgSrc(src);
        setIsLoaded(true);
        setIsLoading(false);
        onLoad?.();
      };
      
      img.onerror = () => {
        console.warn(`Failed to load image: ${src}, falling back to: ${fallbackSrc}`);
        setImgSrc(fallbackSrc);
        setHasError(true);
        setIsLoading(false);
        onError?.();
      };
    }
  }, [isInViewport, priority, imgSrc, hasError, src, fallbackSrc, onLoad, onError]);
  
  const handleImageLoad = () => {
    setIsLoaded(true);
  };
  
  const handleImageError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      console.warn(`Image failed to load: ${imgSrc}, falling back to: ${fallbackSrc}`);
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };
  
  // Optimize image URL with quality and format parameters
  const optimizeImageUrl = (url: string): string => {
    if (!url || url.startsWith('data:') || hasError) return url;
    
    // For external URLs, return as-is
    if (url.startsWith('http')) return url;
    
    // For local images, we could add optimization parameters
    // This would work with services like Cloudinary, ImageKit, etc.
    try {
      const urlObj = new URL(url, window.location.origin);
      if (quality !== 85) {
        urlObj.searchParams.set('q', quality.toString());
      }
      // Add WebP format support
      if (typeof window !== 'undefined' && 
          document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0) {
        urlObj.searchParams.set('f', 'webp');
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  };
  
  const optimizedSrc = imgSrc ? optimizeImageUrl(imgSrc) : '';
  
  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden", className)}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && currentBlurDataURL && !isLoaded && (
        <img
          src={currentBlurDataURL}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full transition-opacity duration-500",
            isLoaded ? "opacity-0" : "opacity-100"
          )}
          style={{ objectFit }}
          aria-hidden="true"
        />
      )}
      
      {/* Loading skeleton */}
      {(!imgSrc || isLoading) && placeholder === 'empty' && (
        <div 
          className={cn(
            "absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse",
            "flex items-center justify-center"
          )}
        >
          <svg 
            className="w-8 h-8 text-slate-400 dark:text-slate-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                className="opacity-75"
              />
            </svg>
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}
      
      {/* Main image */}
      {optimizedSrc && (
        <img
          src={optimizedSrc}
          alt={alt}
          width={typeof width === 'number' ? width : undefined}
          height={typeof height === 'number' ? height : undefined}
          className={cn(
            "w-full h-full transition-all duration-500",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
            hasError && "opacity-60"
          )}
          style={{ objectFit }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          // Add accessibility attributes
          aria-describedby={hasError ? `${alt}-error` : undefined}
        />
      )}
      
      {/* Error state */}
      {hasError && (
        <div 
          id={`${alt}-error`}
          className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
        >
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
          <span className="text-sm text-center">Failed to load image</span>
        </div>
      )}
      
      {/* Accessibility: Screen reader description */}
      <span className="sr-only">
        {isLoading && "Image is loading"}
        {hasError && "Image failed to load, showing fallback"}
        {isLoaded && !hasError && `Image loaded successfully: ${alt}`}
      </span>
    </div>
  );
};

export default EnhancedImage; 