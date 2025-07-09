'use client';

import React, { useState, useEffect } from 'react';

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

export default function PageTransition({ children, mode = 'fade' }: PageTransitionProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR and initial mount, render children directly
  if (!isMounted || mode === 'none') {
    return <>{children}</>;
  }

  // For client-side, just render children without animation for now
  // This prevents framer-motion import issues while preserving functionality
  return <>{children}</>;
} 