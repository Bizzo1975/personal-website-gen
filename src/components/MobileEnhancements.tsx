'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AccessibleButton } from '@/components/AccessibilityEnhancements';

// Hook for detecting touch gestures with improved sensitivity
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50,
  velocityThreshold: number = 0.3
) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const timeElapsed = touchEnd.time - touchStart.time;
    const velocity = Math.sqrt(distanceX * distanceX + distanceY * distanceY) / timeElapsed;

    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;

    // Check if velocity meets threshold for quick swipes
    const isQuickSwipe = velocity > velocityThreshold;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Horizontal swipe
      if ((isLeftSwipe && isQuickSwipe) && onSwipeLeft) onSwipeLeft();
      if ((isRightSwipe && isQuickSwipe) && onSwipeRight) onSwipeRight();
    } else {
      // Vertical swipe
      if ((isUpSwipe && isQuickSwipe) && onSwipeUp) onSwipeUp();
      if ((isDownSwipe && isQuickSwipe) && onSwipeDown) onSwipeDown();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

// Enhanced mobile navigation with better accessibility
interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  navigationItems: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
    badge?: string;
    isActive?: boolean;
  }>;
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onToggle,
  navigationItems,
  className = ''
}) => {
  const [touchPosition, setTouchPosition] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Handle swipe to close
  const swipeGestures = useSwipeGesture(
    () => {
      if (isOpen) onToggle(); // Swipe left to close
    },
    undefined,
    undefined,
    undefined,
    100
  );

  // Handle backdrop touch
  const handleBackdropTouch = (e: React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      onToggle();
    }
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onToggle();
    }
    
    if (e.key === 'Tab') {
      const focusableElements = navRef.current?.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={onToggle}
        className={`relative w-12 h-12 flex flex-col justify-center items-center bg-transparent border-none cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${className}`}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
      >
        <span
          className={`block w-6 h-0.5 bg-slate-800 dark:bg-slate-200 transition-all duration-300 ease-in-out ${
            isOpen ? 'rotate-45 translate-y-1.5' : ''
          }`}
          aria-hidden="true"
        />
        <span
          className={`block w-6 h-0.5 bg-slate-800 dark:bg-slate-200 transition-all duration-300 ease-in-out mt-1 ${
            isOpen ? 'opacity-0' : ''
          }`}
          aria-hidden="true"
        />
        <span
          className={`block w-6 h-0.5 bg-slate-800 dark:bg-slate-200 transition-all duration-300 ease-in-out mt-1 ${
            isOpen ? '-rotate-45 -translate-y-1.5' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm"
          onTouchStart={handleBackdropTouch}
          onClick={onToggle}
          aria-hidden="true"
        >
          {/* Navigation Panel */}
          <div
            ref={navRef}
            id="mobile-navigation"
            className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-xl transform transition-transform duration-300 ease-in-out ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            {...swipeGestures}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 id="mobile-nav-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Navigation
              </h2>
              <button
                ref={lastFocusableRef}
                onClick={onToggle}
                className="p-2 -m-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-6 py-4 overflow-y-auto" aria-label="Mobile navigation">
              <ul className="space-y-2" role="list">
                {navigationItems.map((item, index) => (
                  <li key={index} role="listitem">
                    <a
                      ref={index === 0 ? firstFocusableRef : undefined}
                      href={item.href}
                      className={`flex items-center justify-between p-3 -m-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        item.isActive 
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                          : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700'
                      }`}
                      onClick={onToggle}
                      aria-current={item.isActive ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && (
                          <span className="text-slate-600 dark:text-slate-400 flex-shrink-0" aria-hidden="true">
                            {item.icon}
                          </span>
                        )}
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Swipe left or tap outside to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Enhanced Touch-Friendly Button Component
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  ripple?: boolean;
  hapticFeedback?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ripple = true,
  hapticFeedback = true
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Haptic feedback for mobile devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Create ripple effect
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };

      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.();
  }, [disabled, onClick, ripple, hapticFeedback]);

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 active:bg-slate-400 dark:active:bg-slate-500';
      case 'outline':
        return 'border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/40';
      case 'ghost':
        return 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700';
      default:
        return 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 dark:active:bg-blue-700';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm min-h-[40px] min-w-[40px]';
      case 'lg':
        return 'px-6 py-4 text-lg min-h-[56px] min-w-[56px]';
      default:
        return 'px-4 py-3 text-base min-h-[48px] min-w-[48px]';
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-lg font-medium transition-all duration-200 ease-in-out
        touch-manipulation select-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed
        ${isPressed ? 'scale-95' : 'scale-100'}
        ${getVariantClasses()} ${getSizeClasses()} ${className}
      `}
      aria-pressed={isPressed}
    >
      {children}
      
      {/* Ripple Effect */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none rounded-full bg-white bg-opacity-30 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20
          }}
          aria-hidden="true"
        />
      ))}
    </button>
  );
};

// Enhanced Swipeable Image Gallery
interface SwipeableImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const SwipeableImageGallery: React.FC<SwipeableImageGalleryProps> = ({
  images,
  className = '',
  autoPlay = false,
  autoPlayInterval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  const nextImage = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [images.length, isTransitioning]);

  const prevImage = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [images.length, isTransitioning]);

  const goToImage = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, isTransitioning]);

  const swipeGestures = useSwipeGesture(
    nextImage,  // Swipe left for next
    prevImage,  // Swipe right for previous
    undefined,
    undefined,
    30
  );

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isPaused && images.length > 1) {
      autoPlayRef.current = setInterval(nextImage, autoPlayInterval);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, isPaused, nextImage, autoPlayInterval, images.length]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        prevImage();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextImage();
        break;
      case ' ':
        e.preventDefault();
        if (autoPlay) {
          setIsPaused(!isPaused);
        }
        break;
    }
  };

  if (images.length === 0) return null;

  return (
    <div 
      className={`relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Image gallery"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Image */}
      <div
        className="relative aspect-video overflow-hidden"
        {...swipeGestures}
      >
        <img
          src={images[currentIndex].src}
          alt={images[currentIndex].alt}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isTransitioning ? 'scale-105' : 'scale-100'
          }`}
        />

        {/* Navigation Overlays */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all touch-manipulation focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Previous image"
              disabled={isTransitioning}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all touch-manipulation focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Next image"
              disabled={isTransitioning}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Auto-play control */}
        {autoPlay && images.length > 1 && (
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="absolute top-2 right-2 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
          >
            {isPaused ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            )}
          </button>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-2 px-3 py-1 bg-black bg-opacity-50 text-white text-sm rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                index === currentIndex 
                  ? 'border-primary-500 opacity-100' 
                  : 'border-transparent opacity-60 hover:opacity-80'
              }`}
              aria-label={`Go to image ${index + 1}: ${image.alt}`}
              disabled={isTransitioning}
            >
              <img
                src={image.src}
                alt=""
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      )}

      {/* Caption */}
      {images[currentIndex].caption && (
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            {images[currentIndex].caption}
          </p>
        </div>
      )}
    </div>
  );
};

// Enhanced Viewport Handling with better mobile support
export const useViewportOptimization = () => {
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateViewport = () => {
      // Use visual viewport API if available, fallback to window dimensions
      const height = window.visualViewport?.height || window.innerHeight;
      const width = window.visualViewport?.width || window.innerWidth;
      
      setViewportHeight(height);
      setViewportWidth(width);
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setOrientation(height > width ? 'portrait' : 'landscape');

      // Set CSS custom properties for dynamic viewport dimensions
      document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
      document.documentElement.style.setProperty('--vw', `${width * 0.01}px`);
      document.documentElement.style.setProperty('--viewport-height', `${height}px`);
      document.documentElement.style.setProperty('--viewport-width', `${width}px`);
    };

    updateViewport();

    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
    } else {
      window.addEventListener('resize', updateViewport);
      window.addEventListener('orientationchange', () => {
        // Delay to ensure orientation change is complete
        setTimeout(updateViewport, 100);
      });
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      } else {
        window.removeEventListener('resize', updateViewport);
        window.removeEventListener('orientationchange', updateViewport);
      }
    };
  }, []);

  return { 
    viewportHeight, 
    viewportWidth, 
    isMobile, 
    isTablet, 
    orientation,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait'
  };
};

// Enhanced Pull to Refresh with better UX
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  className = '',
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [canPull, setCanPull] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setCanPull(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !canPull || !containerRef.current) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0 && distance < threshold * 2) {
      e.preventDefault();
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || !canPull) return;
    
    setCanPull(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div className={`relative ${className}`}>
      {/* Pull Indicator */}
      {showIndicator && (
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 transition-all duration-200"
          style={{
            transform: `translateY(${isRefreshing ? 0 : pullDistance - threshold}px)`,
            opacity: isRefreshing ? 1 : refreshProgress
          }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div
              className={`w-6 h-6 border-2 border-current border-t-transparent rounded-full ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: `rotate(${refreshProgress * 360}deg)`
              }}
              aria-hidden="true"
            />
            <span className="text-sm font-medium">
              {isRefreshing ? 'Refreshing...' : refreshProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={containerRef}
        className="overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${isRefreshing ? 60 : Math.min(pullDistance, threshold)}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.2s ease' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default {
  useSwipeGesture,
  MobileNavigation,
  TouchButton,
  SwipeableImageGallery,
  useViewportOptimization,
  PullToRefresh
}; 