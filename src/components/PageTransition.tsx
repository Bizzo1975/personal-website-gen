'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  mode?: 'fade' | 'slide' | 'none';
}

const pageVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slide: {
    initial: { opacity: 0, x: -200 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 200 }
  },
  none: {
    initial: {},
    animate: {},
    exit: {}
  }
};

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  mode = 'fade' 
}) => {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={pageVariants[mode].initial}
        animate={pageVariants[mode].animate}
        exit={pageVariants[mode].exit}
        transition={{ 
          type: 'tween', 
          ease: 'easeInOut', 
          duration: 0.4 
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition; 