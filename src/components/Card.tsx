'use client';

import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered' | 'glass';
  interactive?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  interactive = false,
  onClick,
  ariaLabel,
}) => {
  const baseClasses = 'rounded-xl overflow-hidden transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-gray-200 dark:bg-gray-800 shadow-sm border border-gray-300 dark:border-gray-700',
    elevated: 'bg-gray-200 dark:bg-gray-800 shadow-xl border border-gray-300 dark:border-gray-700',
    bordered: 'bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700',
    glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-700/30 shadow-sm',
  };
  
  const interactiveClasses = interactive 
    ? 'hover:shadow-md hover:translate-y-[-2px] focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 outline-none cursor-pointer' 
    : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`;
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };
  
  return (
    <div 
      className={classes}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
  withDivider?: boolean;
}> = ({ children, className = '', withDivider = true }) => {
  return (
    <div className={`px-6 py-5 ${withDivider ? 'border-b border-gray-300 dark:border-gray-700' : ''} ${className}`}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
  withDivider?: boolean;
}> = ({ children, className = '', withDivider = true }) => {
  return (
    <div className={`px-6 py-4 ${withDivider ? 'border-t border-gray-300 dark:border-gray-700' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default Card; 