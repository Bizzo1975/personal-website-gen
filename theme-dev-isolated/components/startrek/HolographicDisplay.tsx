'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface HolographicDisplayProps {
  children: React.ReactNode;
  type?: 'projection' | 'status' | 'alert';
  intensity?: number;
  flicker?: boolean;
  autoRotate?: boolean;
  className?: string;
}

const HolographicDisplay: React.FC<HolographicDisplayProps> = ({
  children,
  type = 'projection',
  intensity = 1,
  flicker = false,
  autoRotate = false,
  className = ''
}) => {
  const [flickerState, setFlickerState] = useState(false);

  useEffect(() => {
    if (flicker) {
      const interval = setInterval(() => {
        setFlickerState(prev => !prev);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [flicker]);

  return (
    <motion.div
      className={`hologram hologram-${type} intensity-${intensity} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={autoRotate ? { opacity: 1, scale: 1, rotateY: 360 } : { opacity: 1, scale: 1 }}
      transition={autoRotate ? { duration: 20, repeat: Infinity, ease: "linear" } : { duration: 0.8, ease: "easeOut" }}
    >
      {flicker && (
        <div className={`hologram-flicker ${flickerState ? 'active' : ''}`}></div>
      )}
      <div className="hologram-content">
        {children}
      </div>
      <div className="hologram-glow"></div>
    </motion.div>
  );
};

export default HolographicDisplay;
