'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

// Temporarily disable framer-motion to avoid import issues
// import { motion, AnimatePresence } from 'framer-motion';

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

  // Temporarily return children without animation to avoid framer-motion issues
  return (
    <div className="w-full">
      {children}
    </div>
  );
};

export default PageTransition; 