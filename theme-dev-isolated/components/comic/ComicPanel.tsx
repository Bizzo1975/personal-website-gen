'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComicPanelProps {
  children: React.ReactNode;
  panelType?: 'main' | 'sidebar' | 'full-width';
  borderStyle?: 'solid' | 'dashed' | 'halftone';
  animation?: 'slide-in' | 'zoom-in' | 'fade-in' | 'page-turn';
  delay?: number;
  className?: string;
}

const ComicPanel: React.FC<ComicPanelProps> = ({
  children,
  panelType = 'main',
  borderStyle = 'solid',
  animation = 'slide-in',
  delay = 0,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationVariants = () => {
    switch (animation) {
      case 'slide-in':
        return {
          hidden: { x: -100, opacity: 0 },
          visible: { x: 0, opacity: 1 }
        };
      case 'zoom-in':
        return {
          hidden: { scale: 0.8, opacity: 0 },
          visible: { scale: 1, opacity: 1 }
        };
      case 'fade-in':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
      case 'page-turn':
        return {
          hidden: { rotateY: -90, opacity: 0 },
          visible: { rotateY: 0, opacity: 1 }
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`comic-panel comic-panel-${panelType} comic-border-${borderStyle} ${className}`}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={getAnimationVariants()}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="comic-panel-content">
            {children}
          </div>
          <div className="comic-panel-border"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComicPanel;
