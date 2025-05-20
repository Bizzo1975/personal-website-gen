'use client';

import React, { useRef, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  siteKey?: string;
  className?: string;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
}

const RecaptchaComponent: React.FC<ReCaptchaProps> = ({
  onVerify,
  onExpired,
  siteKey,
  className = '',
  theme = 'light',
  size = 'normal'
}) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [key, setKey] = useState<string | undefined>(undefined);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if the default theme should be dark based on system/user preference
  useEffect(() => {
    // Check for dark mode
    if (typeof window !== 'undefined') {
      // Check for dark mode from <html> element
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
      
      // Listen for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.attributeName === 'class' &&
            mutation.target === document.documentElement
          ) {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      return () => {
        observer.disconnect();
      };
    }
  }, []);

  // Get the site key from environment variables if not provided
  useEffect(() => {
    setKey(siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
  }, [siteKey]);

  // Reset the captcha when needed
  const resetCaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  if (!key) {
    return (
      <div className="text-sm text-gray-500 italic">
        ReCAPTCHA not available. Please configure NEXT_PUBLIC_RECAPTCHA_SITE_KEY.
      </div>
    );
  }

  return (
    <div className={`recaptcha-container ${className}`}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={key}
        onChange={onVerify}
        onExpired={() => {
          if (onExpired) {
            onExpired();
          } else {
            onVerify(null);
          }
        }}
        theme={isDarkMode ? 'dark' : theme}
        size={size}
      />
    </div>
  );
};

export default RecaptchaComponent;
