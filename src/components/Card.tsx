'use client';

import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered';
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
  const baseClasses = 'bg-white dark:bg-slate-900 rounded-lg overflow-hidden';
  
  const variantClasses = {
    default: 'shadow-tech',
    elevated: 'shadow-tech-lg',
    bordered: 'border border-slate-200 dark:border-slate-800',
  };
  
  const interactiveClasses = interactive 
    ? 'transition-all duration-300 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary-500 outline-none cursor-pointer' 
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
}> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-slate-200 dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-t border-slate-200 dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
};

export default Card; 