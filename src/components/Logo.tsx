'use client';

import React from 'react';

// Logo component with variations
interface LogoProps {
  variant?: 'full' | 'icon' | 'text' | 'minimal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  theme = 'auto',
  className = '',
  animated = false
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24'
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  };

  const getThemeColors = () => {
    if (theme === 'light') {
      return {
        primary: '#10b981',
        secondary: '#0ea5e9'
      };
    } else if (theme === 'dark') {
      return {
        primary: '#0ea5e9',
        secondary: '#1e3a8a'
      };
    } else {
      // Auto theme - use CSS variables
      return {
        primary: 'rgb(var(--primary))',
        secondary: 'rgb(var(--secondary))'
      };
    }
  };

  const colors = getThemeColors();

  const LogoIcon = () => (
    <svg
      className={`${sizeClasses[size]} ${animated ? 'animate-pulse' : ''}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer diamond shape */}
      <path
        d="M50 5 L85 50 L50 95 L15 50 Z"
        fill={colors.primary}
        className="transition-colors duration-300"
      />
      
      {/* Inner geometric pattern */}
      <path
        d="M50 20 L70 50 L50 80 L30 50 Z"
        fill={colors.secondary}
        className="transition-colors duration-300"
      />
      
      {/* Center accent */}
      <circle
        cx="50"
        cy="50"
        r="8"
        fill="white"
        className="transition-colors duration-300"
      />
      
      {/* Initials */}
      <text
        x="50"
        y="55"
        textAnchor="middle"
        className="fill-current text-xs font-bold"
        style={{ fill: colors.primary }}
      >
        JLK
      </text>
    </svg>
  );

  const LogoText = () => (
    <span
      className={`${textSizes[size]} font-bold tracking-tight ${className}`}
      style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}
    >
      Jonathan L Keck
    </span>
  );

  const renderLogo = () => {
    switch (variant) {
      case 'icon':
        return <LogoIcon />;
      
      case 'text':
        return <LogoText />;
      
      case 'minimal':
        return (
          <div className={`flex items-center space-x-2 ${className}`}>
            <div className={`${sizeClasses[size]} relative`}>
              <div
                className="w-full h-full rounded-lg"
                style={{ backgroundColor: colors.primary }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs"
              >
                JLK
              </span>
            </div>
          </div>
        );
      
      case 'full':
      default:
        return (
          <div className={`flex items-center space-x-3 ${className}`}>
            <LogoIcon />
            <LogoText />
          </div>
        );
    }
  };

  return renderLogo();
};

export default Logo; 