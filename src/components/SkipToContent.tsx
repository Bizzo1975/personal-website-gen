'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkipToContentProps {
  contentId?: string;
  className?: string;
}

const SkipToContent: React.FC<SkipToContentProps> = ({
  contentId = 'main-content',
  className,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(contentId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${contentId}`}
      onClick={handleClick}
      className={cn(
        'fixed z-50 p-3 m-3 font-medium text-white bg-primary-600 transition-transform rounded',
        'focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
        'translate-y-[-120%] top-0 left-0',
        className
      )}
      aria-label="Skip to main content"
    >
      Skip to content
    </a>
  );
};

export default SkipToContent; 