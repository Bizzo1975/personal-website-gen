'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LCARSPanelProps {
  children: React.ReactNode;
  panelType?: 'main' | 'sidebar' | 'status' | 'alert';
  color?: 'orange' | 'blue' | 'gray' | 'red' | 'green';
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  className?: string;
}

const LCARSPanel: React.FC<LCARSPanelProps> = ({
  children,
  panelType = 'main',
  color = 'orange',
  size = 'medium',
  interactive = false,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(false);
  const [scanLine, setScanLine] = useState(false);

  useEffect(() => {
    if (interactive) {
      const interval = setInterval(() => {
        setScanLine(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [interactive]);

  const handleClick = () => {
    if (interactive) {
      setIsActive(!isActive);
      // Play computer beep sound
      playComputerBeep();
    }
  };

  const playComputerBeep = () => {
    // Implementation for computer beep sound
    console.log('Computer beep sound played');
  };

  return (
    <motion.div
      className={`lcars-panel lcars-${panelType} lcars-${color} lcars-${size} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={handleClick}
      whileHover={interactive ? { scale: 1.02 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
    >
      <div className="lcars-content">
        {children}
      </div>
      <div className="lcars-border"></div>
      {scanLine && (
        <div className="scanning-line"></div>
      )}
      {isActive && (
        <div className="lcars-active-indicator"></div>
      )}
    </motion.div>
  );
};

export default LCARSPanel;
