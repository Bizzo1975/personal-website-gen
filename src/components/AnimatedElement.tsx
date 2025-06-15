'use client';

import React from 'react';
import { motion, MotionProps } from 'framer-motion';

type AnimationType = 
  | 'fadeIn' 
  | 'slideUp' 
  | 'slideDown' 
  | 'slideLeft' 
  | 'slideRight' 
  | 'scale' 
  | 'pulse'
  | 'bounce';

type StaggerDirection = 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';

interface AnimatedElementProps extends MotionProps {
  children: React.ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  staggerIndex?: number;
  staggerDelay?: number;
  as?: React.ElementType;
}

// Animation variant presets
const animations: Record<AnimationType, {
  initial: any;
  animate: any;
  exit?: any;
}> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  pulse: {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, repeatType: "reverse", duration: 1.5 } 
    }
  },
  bounce: {
    initial: { y: 0 },
    animate: { 
      y: [0, -10, 0],
      transition: { repeat: Infinity, repeatType: "reverse", duration: 1 } 
    }
  }
};

const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  type = 'fadeIn',
  delay = 0,
  duration = 0.5,
  className = '',
  staggerIndex = 0,
  staggerDelay = 0.1,
  as = 'div',
  ...props
}) => {
  // Calculate total delay including stagger effect
  const totalDelay = delay + (staggerIndex * staggerDelay);
  
  // Get animation variant based on type
  const variant = animations[type];
  
  // Customize transition based on props
  const transition = {
    duration,
    delay: totalDelay,
    ease: 'easeOut',
  };

  // Create motion component with specified element type
  const MotionTag = motion.div;

  return (
    <MotionTag
      initial={variant.initial}
      animate={variant.animate}
      exit={variant.exit}
      transition={transition}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  );
};

// Helper function to create staggered children animations
export const createStaggeredChildren = (
  children: React.ReactNode[], 
  type: AnimationType = 'fadeIn',
  staggerDelay: number = 0.1,
  initialDelay: number = 0,
  direction: StaggerDirection = 'top-to-bottom'
) => {
  // If direction is reversed, adjust the indices
  const orderedChildren = [...children];
  if (direction === 'right-to-left' || direction === 'bottom-to-top') {
    orderedChildren.reverse();
  }

  return orderedChildren.map((child, index) => (
    <AnimatedElement
      key={index}
      type={type}
      staggerIndex={index}
      staggerDelay={staggerDelay}
      delay={initialDelay}
    >
      {child}
    </AnimatedElement>
  ));
};

export default AnimatedElement; 