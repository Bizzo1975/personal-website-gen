'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

interface TiltProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    image?: string;
    slug?: string;
  };
  index: number;
}

const TiltProjectCard: React.FC<TiltProjectCardProps> = ({ project, index }) => {
  const [isMounted, setIsMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  
  // Motion values for enhanced 3D tilt effect - optimized for performance
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 25 });
  
  // Enhanced 3D transform values - restored full rotation
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["20deg", "-20deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-20deg", "20deg"]);
  
  // Enhanced depth and shadow effects
  const translateZ = useTransform(mouseYSpring, [-0.5, 0.5], ["30px", "30px"]);
  const shadowX = useTransform(mouseXSpring, [-0.5, 0.5], ["-40px", "40px"]);
  const shadowY = useTransform(mouseYSpring, [-0.5, 0.5], ["-40px", "40px"]);
  const shadowBlur = useTransform(mouseYSpring, [-0.5, 0.5], ["50px", "50px"]);
  
  // 3D TEXT EFFECTS - The missing piece!
  const textShadowX = useTransform(mouseXSpring, [-0.5, 0.5], ["-3px", "3px"]);
  const textShadowY = useTransform(mouseYSpring, [-0.5, 0.5], ["-3px", "3px"]);
  const textRotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const textRotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);
  
  // Enhanced 3D text depth transforms
  // Type assertion needed because useTransform expects homogeneous MotionValue arrays,
  // but we're mixing number and string MotionValues which is valid at runtime
  const motionValuesArray = [mouseXSpring, mouseYSpring, textRotateX, textRotateY] as any;
  
  const titleTransform = useTransform(
    motionValuesArray,
    ([mx, my, rx, ry]: [number, number, string, string]) => `translateZ(15px) rotateX(${rx}) rotateY(${ry}) translateX(${mx * 10}px) translateY(${my * 10}px)`
  );
  
  const descriptionTransform = useTransform(
    motionValuesArray,
    ([mx, my, rx, ry]: [number, number, string, string]) => `translateZ(10px) rotateX(${parseFloat(rx) * 0.5}deg) rotateY(${parseFloat(ry) * 0.5}deg) translateX(${mx * 5}px) translateY(${my * 5}px)`
  );
  
  const techTransform = useTransform(
    motionValuesArray,
    ([mx, my, rx, ry]: [number, number, string, string]) => `translateZ(25px) rotateX(${parseFloat(rx) * 0.7}deg) rotateY(${parseFloat(ry) * 0.7}deg) translateX(${mx * 8}px) translateY(${my * 8}px)`
  );
  
  const linkTransform = useTransform(
    motionValuesArray,
    ([mx, my, rx, ry]: [number, number, string, string]) => `translateZ(35px) rotateX(${parseFloat(rx) * 0.3}deg) rotateY(${parseFloat(ry) * 0.3}deg) translateX(${mx * 12}px) translateY(${my * 12}px)`
  );
  
  // Dynamic text shadows for both themes
  const titleTextShadow = useTransform(
    [textShadowX, textShadowY],
    (values: string[]) => {
      const [x, y] = values;
      return `${x} ${y} 4px rgba(0, 0, 0, 0.3), ${parseFloat(x) * 2}px ${parseFloat(y) * 2}px 8px rgba(0, 0, 0, 0.1), 0 0 20px rgba(59, 130, 246, 0.2)`;
    }
  );
  
  const descTextShadow = useTransform(
    [textShadowX, textShadowY],
    (values: string[]) => {
      const [x, y] = values;
      return `${x} ${y} 2px rgba(0, 0, 0, 0.2), ${parseFloat(x) * 1.5}px ${parseFloat(y) * 1.5}px 4px rgba(0, 0, 0, 0.1)`;
    }
  );
  
  const techTextShadow = useTransform(
    [textShadowX, textShadowY],
    (values: string[]) => {
      const [x, y] = values;
      return `${x} ${y} 1px rgba(0, 0, 0, 0.15), ${parseFloat(x) * 1.2}px ${parseFloat(y) * 1.2}px 3px rgba(0, 0, 0, 0.1)`;
    }
  );
  
  const linkTextShadow = useTransform(
    [textShadowX, textShadowY],
    (values: string[]) => {
      const [x, y] = values;
      return `${x} ${y} 2px rgba(59, 130, 246, 0.3), ${parseFloat(x) * 1.5}px ${parseFloat(y) * 1.5}px 4px rgba(59, 130, 246, 0.2)`;
    }
  );
  
  const iconDropShadow = useTransform(
    [textShadowX, textShadowY],
    (values: string[]) => {
      const [x, y] = values;
      return `drop-shadow(${x} ${y} 2px rgba(59, 130, 246, 0.4))`;
    }
  );
  
  // Dynamic glow for enhanced 3D depth
  const glowOpacity = useTransform(
    [mouseXSpring, mouseYSpring], 
    (values: number[]) => {
      const [mx, my] = values;
      return Math.min(Math.abs(mx) + Math.abs(my), 0.3);
    }
  );
  
  // Ensure client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Animation variants for stagger effect
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  // Enhanced hover animation variants
  const hoverVariants = {
    rest: { 
      scale: 1,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    },
    hover: { 
      scale: shouldReduceMotion ? 1 : 1.03,
      boxShadow: "0 25px 35px -5px rgba(0, 0, 0, 0.15), 0 15px 15px -5px rgba(0, 0, 0, 0.08)",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden opacity-0">
        <div className="h-48 bg-gray-200 dark:bg-slate-700"></div>
        <div className="p-6">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
          <div className="h-16 bg-gray-200 dark:bg-slate-700 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="perspective-1000"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <Link href={`/projects/${project.slug}`} className="block h-full">
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden h-full group cursor-pointer relative"
          style={{
            transformStyle: "preserve-3d",
            ...(shouldReduceMotion ? {} : {
              rotateX,
              rotateY,
              translateZ
            })
          }}
          variants={hoverVariants}
          initial="rest"
          whileHover="hover"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
        {/* Enhanced 3D shadow layer */}
        {!shouldReduceMotion && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              opacity: glowOpacity,
              transform: `translateX(${shadowX.get()}px) translateY(${shadowY.get()}px)`,
              filter: `blur(${shadowBlur.get()})`
            }}
          />
        )}
        
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <motion.img 
            src={project.image || '/images/projects/placeholder.svg'} 
            alt={project.title}
            width={600}
            height={400}
            className="w-full h-full object-contain"
            style={{ objectFit: 'contain' }}
            loading="lazy"
            whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Enhanced overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* 3D hover icon */}
          <motion.div 
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100"
            initial={{ scale: 0, rotate: 180 }}
            whileHover={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.3 }}
            style={{ transform: shouldReduceMotion ? 'none' : 'translateZ(60px)' }}
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary-600 dark:text-primary-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
          </motion.div>
        </div>
        
        {/* Enhanced 3D Content Section */}
        <div className="p-6 relative" style={{ transform: shouldReduceMotion ? 'none' : 'translateZ(50px)' }}>
          <motion.h3 
            className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300"
            whileHover={{ x: shouldReduceMotion ? 0 : 8 }}
            transition={{ duration: 0.2 }}
            style={shouldReduceMotion ? {
              transformStyle: 'preserve-3d'
            } : {
              transform: titleTransform,
              textShadow: titleTextShadow,
              transformStyle: 'preserve-3d'
            } as unknown as React.CSSProperties}
          >
            {project.title}
          </motion.h3>
          
          <motion.p 
            className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed"
            style={shouldReduceMotion ? {
              transformStyle: 'preserve-3d'
            } : {
              transform: descriptionTransform,
              textShadow: descTextShadow,
              transformStyle: 'preserve-3d'
            } as unknown as React.CSSProperties}
          >
            {project.description}
          </motion.p>
          
          {/* Enhanced 3D Technologies */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.technologies.slice(0, 3).map((tech, techIndex) => (
              <motion.span 
                key={techIndex} 
                className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded text-xs font-medium"
                whileHover={{ scale: shouldReduceMotion ? 1 : 1.08, y: shouldReduceMotion ? 0 : -2 }}
                transition={{ duration: 0.2 }}
                style={shouldReduceMotion ? {
                  transformStyle: 'preserve-3d'
                } : {
                  transform: techTransform,
                  textShadow: techTextShadow,
                  transformStyle: 'preserve-3d'
                } as unknown as React.CSSProperties}
              >
                {tech}
              </motion.span>
            ))}
            {project.technologies.length > 3 && (
              <span 
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-medium"
                style={{ 
                  transform: shouldReduceMotion ? 'none' : 'translateZ(20px)',
                  transformStyle: 'preserve-3d'
                }}
              >
                +{project.technologies.length - 3} more
              </span>
            )}
          </div>
          
          {/* Enhanced 3D Learn More Link */}
          <div
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm inline-flex items-center transition-colors duration-200 group/link"
            style={shouldReduceMotion ? {
              transformStyle: 'preserve-3d'
            } : {
              transform: linkTransform,
              textShadow: linkTextShadow,
              transformStyle: 'preserve-3d'
            } as unknown as React.CSSProperties}
          >
            Learn More
            <motion.svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 ml-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              whileHover={{ x: shouldReduceMotion ? 0 : 5 }}
              transition={{ duration: 0.2 }}
              style={shouldReduceMotion ? {} : {
                transform: 'translateZ(5px)',
                filter: iconDropShadow
              } as unknown as React.CSSProperties}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          </div>
        </div>
      </motion.div>
      </Link>
    </motion.div>
  );
};

export default TiltProjectCard; 