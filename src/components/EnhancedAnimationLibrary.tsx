'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useInView } from 'framer-motion';

// Enhanced animation types
export type AnimationType = 
  | 'fadeIn' 
  | 'fadeOut'
  | 'slideUp' 
  | 'slideDown' 
  | 'slideLeft' 
  | 'slideRight' 
  | 'scale' 
  | 'scaleUp'
  | 'scaleDown'
  | 'pulse'
  | 'bounce'
  | 'shake'
  | 'rotate'
  | 'flip'
  | 'zoom'
  | 'elastic'
  | 'rubber'
  | 'wobble'
  | 'swing'
  | 'flash'
  | 'jello'
  | 'heartbeat'
  | 'rollIn'
  | 'rollOut'
  | 'lightSpeed'
  | 'typewriter';

// Stagger direction types
export type StaggerDirection = 
  | 'left-to-right' 
  | 'right-to-left' 
  | 'top-to-bottom' 
  | 'bottom-to-top'
  | 'center-out'
  | 'edges-in';

// Easing types
export type EasingType = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'circIn'
  | 'circOut'
  | 'circInOut'
  | 'backIn'
  | 'backOut'
  | 'backInOut'
  | 'anticipate'
  | 'bounceIn'
  | 'bounceOut'
  | 'bounceInOut';

// Enhanced animation variants
const enhancedAnimations: Record<AnimationType, {
  initial: any;
  animate: any;
  exit?: any;
  transition?: any;
}> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  fadeOut: {
    initial: { opacity: 1 },
    animate: { opacity: 0 },
    exit: { opacity: 1 }
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 30 }
  },
  slideDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 }
  },
  slideRight: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  scaleUp: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    exit: { scale: 0 },
    transition: { type: "spring", stiffness: 260, damping: 20 }
  },
  scaleDown: {
    initial: { scale: 1.2 },
    animate: { scale: 1 },
    exit: { scale: 1.2 }
  },
  pulse: {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } 
    }
  },
  bounce: {
    initial: { y: 0 },
    animate: { 
      y: [0, -20, 0],
      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } 
    }
  },
  shake: {
    initial: { x: 0 },
    animate: { 
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    }
  },
  rotate: {
    initial: { rotate: 0 },
    animate: { rotate: 360 },
    transition: { duration: 1, ease: "linear" }
  },
  flip: {
    initial: { rotateY: 0 },
    animate: { rotateY: 180 },
    exit: { rotateY: 0 },
    transition: { duration: 0.6 }
  },
  zoom: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: "spring", stiffness: 300, damping: 25 }
  },
  elastic: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    exit: { scale: 0 },
    transition: { type: "spring", stiffness: 400, damping: 10 }
  },
  rubber: {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
      transition: { duration: 1 }
    }
  },
  wobble: {
    initial: { rotate: 0 },
    animate: { 
      rotate: [0, -5, 5, -5, 5, 0],
      transition: { duration: 1 }
    }
  },
  swing: {
    initial: { rotate: 0, transformOrigin: "top center" },
    animate: { 
      rotate: [0, 15, -10, 5, -5, 0],
      transition: { duration: 1 }
    }
  },
  flash: {
    initial: { opacity: 1 },
    animate: { 
      opacity: [1, 0, 1, 0, 1],
      transition: { duration: 0.75 }
    }
  },
  jello: {
    initial: { skewX: 0, skewY: 0 },
    animate: { 
      skewX: [0, -12.5, 6.25, -3.125, 1.5625, 0],
      skewY: [0, -12.5, 6.25, -3.125, 1.5625, 0],
      transition: { duration: 1 }
    }
  },
  heartbeat: {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.3, 1, 1.3, 1],
      transition: { duration: 1.3, repeat: Infinity }
    }
  },
  rollIn: {
    initial: { opacity: 0, rotate: -120, x: -100 },
    animate: { opacity: 1, rotate: 0, x: 0 },
    exit: { opacity: 0, rotate: -120, x: -100 }
  },
  rollOut: {
    initial: { opacity: 1, rotate: 0, x: 0 },
    animate: { opacity: 0, rotate: 120, x: 100 },
    exit: { opacity: 1, rotate: 0, x: 0 }
  },
  lightSpeed: {
    initial: { opacity: 0, x: 100, skewX: -30 },
    animate: { opacity: 1, x: 0, skewX: 0 },
    exit: { opacity: 0, x: 100, skewX: -30 },
    transition: { duration: 0.6, ease: "easeOut" }
  },
  typewriter: {
    initial: { width: 0 },
    animate: { width: "auto" },
    transition: { duration: 2, ease: "steps(20)" }
  }
};

// Easing functions
const easingFunctions = {
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  circIn: [0.6, 0.04, 0.98, 0.335],
  circOut: [0.075, 0.82, 0.165, 1],
  circInOut: [0.785, 0.135, 0.15, 0.86],
  backIn: [0.6, -0.28, 0.735, 0.045],
  backOut: [0.175, 0.885, 0.32, 1.275],
  backInOut: [0.68, -0.55, 0.265, 1.55],
  anticipate: [0, 0, 0.2, 1],
  bounceIn: [0.68, -0.55, 0.265, 1.55],
  bounceOut: [0.175, 0.885, 0.32, 1.275],
  bounceInOut: [0.68, -0.55, 0.265, 1.55]
};

interface EnhancedAnimatedElementProps {
  children: React.ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  easing?: EasingType;
  className?: string;
  staggerIndex?: number;
  staggerDelay?: number;
  as?: keyof JSX.IntrinsicElements;
  trigger?: 'mount' | 'hover' | 'inView' | 'manual';
  repeat?: number | boolean;
  repeatType?: 'loop' | 'reverse' | 'mirror';
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  disabled?: boolean;
  viewport?: { once?: boolean; amount?: number };
  style?: React.CSSProperties;
}

export const EnhancedAnimatedElement: React.FC<EnhancedAnimatedElementProps> = ({
  children,
  type = 'fadeIn',
  delay = 0,
  duration = 0.5,
  easing = 'easeOut',
  className = '',
  staggerIndex = 0,
  staggerDelay = 0.1,
  as = 'div',
  trigger = 'mount',
  repeat = 0,
  repeatType = 'loop',
  onAnimationStart,
  onAnimationComplete,
  disabled = false,
  viewport = { once: true, amount: 0.1 },
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [manualTrigger, setManualTrigger] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Handle client-side mounting with error handling
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        setIsMounted(true);
      }, 10);
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.warn('Error during animation mounting:', error);
      setHasError(true);
    }
  }, []);
  
  // Use intersection observer for inView trigger with error handling
  const ref = React.useRef(null);
  let isInView = false;
  
  try {
    isInView = useInView(ref, viewport);
  } catch (error) {
    console.warn('Error with useInView:', error);
    isInView = true;
    setHasError(true);
  }
  
  // Calculate total delay including stagger effect
  const totalDelay = delay + (staggerIndex * staggerDelay);
  
  // Get animation variant based on type with error handling
  const variant = enhancedAnimations[type] || enhancedAnimations.fadeIn;
  
  // Determine if animation should be active
  const shouldAnimate = !disabled && !shouldReduceMotion && !hasError && isMounted && (
    trigger === 'mount' ||
    (trigger === 'hover' && isHovered) ||
    (trigger === 'inView' && isInView) ||
    (trigger === 'manual' && manualTrigger)
  );
  
  // Always show final state to prevent hydration mismatch
  const animateToState = variant.animate;
  
  // Create transition configuration with safe fallbacks
  const transition = {
    duration: shouldReduceMotion || !isMounted || hasError ? 0.01 : Math.max(0.01, duration),
    delay: shouldReduceMotion || !isMounted || hasError ? 0 : Math.max(0, totalDelay),
    ease: easingFunctions[easing] || easingFunctions.easeOut,
    repeat: typeof repeat === 'boolean' ? (repeat ? Infinity : 0) : Math.max(0, repeat),
    repeatType,
    ...variant.transition,
  };
  
  // Create motion component with specified element type
  let MotionComponent;
  try {
    MotionComponent = motion[as as keyof typeof motion] as any;
  } catch (error) {
    console.warn('Error creating motion component:', error);
    MotionComponent = motion.div;
    setHasError(true);
  }
  
  // Handle hover events with error protection
  const handleMouseEnter = () => {
    try {
      if (trigger === 'hover') setIsHovered(true);
    } catch (error) {
      console.warn('Error in handleMouseEnter:', error);
    }
  };
  
  const handleMouseLeave = () => {
    try {
      if (trigger === 'hover') setIsHovered(false);
    } catch (error) {
      console.warn('Error in handleMouseLeave:', error);
    }
  };
  
  // Protected animation callbacks
  const protectedOnAnimationStart = () => {
    try {
      onAnimationStart?.();
    } catch (error) {
      console.warn('Error in onAnimationStart:', error);
    }
  };
  
  const protectedOnAnimationComplete = () => {
    try {
      onAnimationComplete?.();
    } catch (error) {
      console.warn('Error in onAnimationComplete:', error);
    }
  };
  
  // If there's an error or not mounted, render static content
  if (hasError || !isMounted) {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          opacity: 1,
          ...props.style
        }}
      >
        {children}
      </div>
    );
  }
  
  // Always render motion component to ensure consistent structure
  try {
    return (
      <MotionComponent
        ref={ref}
        initial={isMounted ? variant.initial : variant.animate}
        animate={animateToState}
        exit={variant.exit}
        transition={transition}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onAnimationStart={protectedOnAnimationStart}
        onAnimationComplete={protectedOnAnimationComplete}
        style={{
          opacity: 1,
          ...props.style
        }}
        {...props}
      >
        {children}
      </MotionComponent>
    );
  } catch (error) {
    console.warn('Error rendering motion component:', error);
    return (
      <div
        ref={ref}
        className={className}
        style={{
          opacity: 1,
          ...props.style
        }}
      >
        {children}
      </div>
    );
  }
};

// Enhanced staggered children component
interface StaggeredChildrenProps {
  children: React.ReactNode[];
  type?: AnimationType;
  staggerDelay?: number;
  initialDelay?: number;
  direction?: StaggerDirection;
  className?: string;
  containerProps?: any;
}

export const StaggeredChildren: React.FC<StaggeredChildrenProps> = ({
  children,
  type = 'fadeIn',
  staggerDelay = 0.1,
  initialDelay = 0,
  direction = 'top-to-bottom',
  className = '',
  containerProps = {},
}) => {
  // Temporarily disable staggered animations to fix hydration error
  // Just render children directly without animation wrappers
  return (
    <div className={className} {...containerProps}>
      {children}
    </div>
  );
};

// Page transition component
interface PageTransitionProps {
  children: React.ReactNode;
  mode?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  mode = 'fade',
  duration = 0.3,
}) => {
  const shouldReduceMotion = useReducedMotion();
  
  const transitions = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 }
    },
    none: {
      initial: {},
      animate: {},
      exit: {}
    }
  };
  
  if (shouldReduceMotion || mode === 'none') {
    return <>{children}</>;
  }
  
  const transition = transitions[mode];
  
  return (
    <motion.div
      initial={transition.initial}
      animate={transition.animate}
      exit={transition.exit}
      transition={{ duration, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

// Scroll-triggered animation component
interface ScrollAnimationProps {
  children: React.ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  easing?: EasingType;
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
  disabled?: boolean;
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  type = 'fadeIn',
  delay = 0,
  duration = 0.5,
  easing = 'easeOut',
  className = '',
  threshold = 0.1,
  triggerOnce = true,
  disabled = false,
  ...props
}) => {
  return (
    <EnhancedAnimatedElement
      type={type}
      trigger="inView"
      viewport={{ once: triggerOnce, amount: threshold }}
      className={className}
      delay={delay}
      duration={duration}
      easing={easing}
      disabled={disabled}
      {...props}
    >
      {children}
    </EnhancedAnimatedElement>
  );
};

// Hover animation component
interface HoverAnimationProps {
  children: React.ReactNode;
  type?: AnimationType;
  className?: string;
}

export const HoverAnimation: React.FC<HoverAnimationProps> = ({
  children,
  type = 'scale',
  className = '',
}) => {
  return (
    <EnhancedAnimatedElement
      type={type}
      trigger="hover"
      className={className}
    >
      {children}
    </EnhancedAnimatedElement>
  );
};

// Loading animation component
interface LoadingAnimationProps {
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = 'spinner',
  size = 'md',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  if (shouldReduceMotion) {
    return <div className={`${sizeClasses[size]} bg-current opacity-50 rounded ${className}`} />;
  }
  
  switch (type) {
    case 'spinner':
      return (
        <motion.div
          className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full ${className}`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      );
    
    case 'dots':
      return (
        <div className={`flex space-x-1 ${className}`}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-current rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      );
    
    case 'pulse':
      return (
        <motion.div
          className={`${sizeClasses[size]} bg-current rounded ${className}`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      );
    
    case 'skeleton':
      return (
        <motion.div
          className={`${sizeClasses[size]} bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded ${className}`}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ backgroundSize: '200% 100%' }}
        />
      );
    
    default:
      return null;
  }
};

// Export all animation types for TypeScript
export { enhancedAnimations, easingFunctions };

export default EnhancedAnimatedElement; 
