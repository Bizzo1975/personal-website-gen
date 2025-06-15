'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AccessibilityEnhancementsProps {
  children: React.ReactNode;
}

// High contrast theme provider
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check if user prefers high contrast
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
    document.documentElement.classList.toggle('high-contrast', !isHighContrast);
    // Store preference
    localStorage.setItem('high-contrast', (!isHighContrast).toString());
  };

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('high-contrast');
    if (saved === 'true') {
      setIsHighContrast(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  return { isHighContrast, toggleHighContrast };
};

// Text scaling hook
export const useTextScaling = () => {
  const [textScale, setTextScale] = useState(1);

  const setScale = (scale: number) => {
    setTextScale(scale);
    document.documentElement.style.fontSize = `${16 * scale}px`;
    localStorage.setItem('text-scale', scale.toString());
  };

  useEffect(() => {
    const saved = localStorage.getItem('text-scale');
    if (saved) {
      const scale = parseFloat(saved);
      setTextScale(scale);
      document.documentElement.style.fontSize = `${16 * scale}px`;
    }
  }, []);

  return { textScale, setScale };
};

// Accessibility toolbar component
export const AccessibilityToolbar: React.FC = () => {
  const { isHighContrast, toggleHighContrast } = useHighContrast();
  const { textScale, setScale } = useTextScaling();
  const [isVisible, setIsVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleReduceMotion = () => {
    const newValue = !reduceMotion;
    setReduceMotion(newValue);
    if (newValue) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    localStorage.setItem('reduce-motion', newValue.toString());
  };

  const toggleKeyboardNavigation = () => {
    const newValue = !keyboardNavigation;
    setKeyboardNavigation(newValue);
    if (newValue) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
    localStorage.setItem('keyboard-navigation', newValue.toString());
  };

  // Load saved preferences
  useEffect(() => {
    const savedMotion = localStorage.getItem('reduce-motion');
    const savedKeyboard = localStorage.getItem('keyboard-navigation');
    
    if (savedMotion === 'true') {
      setReduceMotion(true);
      document.documentElement.classList.add('reduce-motion');
    }
    
    if (savedKeyboard === 'true') {
      setKeyboardNavigation(true);
      document.body.classList.add('keyboard-navigation');
    }
  }, []);

  return (
    <>
      {/* Accessibility toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={cn(
          "fixed top-4 right-4 z-50 p-3 rounded-full",
          "bg-primary-600 text-white hover:bg-primary-700",
          "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2",
          "transition-all duration-200 shadow-lg",
          "border-2 border-transparent hover:border-primary-300"
        )}
        aria-label={isVisible ? "Close accessibility options" : "Open accessibility options"}
        aria-expanded={isVisible}
        title="Accessibility Options"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      </button>

      {/* Accessibility panel */}
      {isVisible && (
        <div 
          className={cn(
            "fixed top-16 right-4 z-40 p-6 rounded-lg shadow-xl",
            "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
            "min-w-[300px] max-w-[400px]"
          )}
          role="dialog"
          aria-labelledby="accessibility-title"
          aria-describedby="accessibility-description"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 id="accessibility-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Accessibility Options
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close accessibility options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p id="accessibility-description" className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Customize your viewing experience for better accessibility.
          </p>
          
          <div className="space-y-4">
            {/* High contrast toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="high-contrast-toggle" className="flex items-center space-x-3 cursor-pointer">
                <input
                  id="high-contrast-toggle"
                  type="checkbox"
                  checked={isHighContrast}
                  onChange={toggleHighContrast}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  aria-describedby="high-contrast-desc"
                />
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">High Contrast Mode</span>
                  <p id="high-contrast-desc" className="text-xs text-slate-600 dark:text-slate-400">
                    Increases contrast for better visibility
                  </p>
                </div>
              </label>
            </div>

            {/* Font size controls */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                Text Size
              </label>
              <div className="flex space-x-2" role="group" aria-label="Text size options">
                <button
                  onClick={() => setScale(0.875)}
                  className={cn(
                    "px-3 py-2 text-sm border rounded-md transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500",
                    textScale === 0.875 
                      ? "bg-primary-600 text-white border-primary-600" 
                      : "border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                  aria-pressed={textScale === 0.875}
                >
                  Small
                </button>
                <button
                  onClick={() => setScale(1)}
                  className={cn(
                    "px-3 py-2 text-sm border rounded-md transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500",
                    textScale === 1 
                      ? "bg-primary-600 text-white border-primary-600" 
                      : "border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                  aria-pressed={textScale === 1}
                >
                  Normal
                </button>
                <button
                  onClick={() => setScale(1.125)}
                  className={cn(
                    "px-3 py-2 text-sm border rounded-md transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500",
                    textScale === 1.125 
                      ? "bg-primary-600 text-white border-primary-600" 
                      : "border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                  aria-pressed={textScale === 1.125}
                >
                  Large
                </button>
                <button
                  onClick={() => setScale(1.25)}
                  className={cn(
                    "px-3 py-2 text-sm border rounded-md transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500",
                    textScale === 1.25 
                      ? "bg-primary-600 text-white border-primary-600" 
                      : "border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                  aria-pressed={textScale === 1.25}
                >
                  X-Large
                </button>
              </div>
            </div>

            {/* Motion preferences */}
            <div className="flex items-center justify-between">
              <label htmlFor="reduce-motion-toggle" className="flex items-center space-x-3 cursor-pointer">
                <input
                  id="reduce-motion-toggle"
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={toggleReduceMotion}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  aria-describedby="reduce-motion-desc"
                />
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">Reduce Motion</span>
                  <p id="reduce-motion-desc" className="text-xs text-slate-600 dark:text-slate-400">
                    Minimizes animations and transitions
                  </p>
                </div>
              </label>
            </div>

            {/* Keyboard navigation */}
            <div className="flex items-center justify-between">
              <label htmlFor="keyboard-nav-toggle" className="flex items-center space-x-3 cursor-pointer">
                <input
                  id="keyboard-nav-toggle"
                  type="checkbox"
                  checked={keyboardNavigation}
                  onChange={toggleKeyboardNavigation}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  aria-describedby="keyboard-nav-desc"
                />
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">Enhanced Focus</span>
                  <p id="keyboard-nav-desc" className="text-xs text-slate-600 dark:text-slate-400">
                    Shows enhanced focus indicators
                  </p>
                </div>
              </label>
            </div>

            {/* Reset button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setScale(1);
                  setReduceMotion(false);
                  setKeyboardNavigation(false);
                  document.documentElement.classList.remove('high-contrast', 'reduce-motion');
                  document.body.classList.remove('keyboard-navigation');
                  document.documentElement.style.fontSize = '';
                  localStorage.removeItem('high-contrast');
                  localStorage.removeItem('text-scale');
                  localStorage.removeItem('reduce-motion');
                  localStorage.removeItem('keyboard-navigation');
                }}
                className="w-full px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Enhanced focus management
export const useFocusManagement = () => {
  useEffect(() => {
    // Add focus-visible polyfill behavior
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    // Handle escape key to close modals/dropdowns
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close any open dropdowns or modals
        const openElements = document.querySelectorAll('[aria-expanded="true"]');
        openElements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.click();
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
};

// Enhanced ARIA announcements
export const useAriaAnnouncements = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };

  return { announce };
};

// Screen reader only text component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Enhanced accessible button component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    "inline-flex items-center justify-center font-medium rounded-lg",
    "transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    // High contrast support
    "high-contrast:border-2 high-contrast:border-current",
    // Touch target size
    "min-h-[44px] min-w-[44px]"
  );

  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600",
    ghost: "text-slate-700 hover:bg-slate-100 focus:ring-slate-500 dark:text-slate-300 dark:hover:bg-slate-800"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-2.5"
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            className="opacity-75"
          />
        </svg>
      )}
      {icon && !loading && <span aria-hidden="true">{icon}</span>}
      {children}
      {loading && <ScreenReaderOnly>Loading...</ScreenReaderOnly>}
    </button>
  );
};

// Skip to main content component
export const SkipToMainContent: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md focus:shadow-lg"
    onClick={(e) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    }}
  >
    Skip to main content
  </a>
);

// Main accessibility provider
const AccessibilityEnhancements: React.FC<AccessibilityEnhancementsProps> = ({ children }) => {
  useFocusManagement();

  return (
    <>
      <SkipToMainContent />
      {children}
      <AccessibilityToolbar />
    </>
  );
};

export default AccessibilityEnhancements; 