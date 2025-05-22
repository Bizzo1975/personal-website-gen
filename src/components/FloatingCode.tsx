'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FloatingCodeProps {
  className?: string;
}

const CODE_SNIPPETS = [
  `function transform() {
  return data.map(item => {
    return item.value;
  });
}`,
  `const butterfly = {
  wings: 2,
  transform: () => {
    fly();
  }
};`,
  `async function animate() {
  await transition();
  return metamorphosis();
}`,
  `class Creation {
  constructor() {
    this.beauty = true;
  }
}`,
  `const pattern = [0, 1, 1, 0];
pattern.forEach(p => {
  create(p);
});`
];

// SVG paths for butterfly wings
const WING_PATHS = [
  "M0,0 C10,20 30,20 40,0 C30,-20 10,-20 0,0",
  "M0,0 C15,25 35,25 50,0 C35,-25 15,-25 0,0",
  "M0,0 C20,30 40,30 60,0 C40,-30 20,-30 0,0",
  "M0,0 C25,35 45,35 70,0 C45,-35 25,-35 0,0"
];

const FloatingCode: React.FC<FloatingCodeProps> = ({ className = '' }) => {
  const [codeElements, setCodeElements] = useState<Array<{
    id: number;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    snippet: string;
    color: string;
    transformed: boolean;
    wingPath: string;
  }>>([]);
  
  useEffect(() => {
    // Initialize code elements
    const elements = Array.from({ length: 5 }, (_, index) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      return {
        id: index,
        x: Math.random() * viewportWidth * 0.8,
        y: Math.random() * viewportHeight * 0.8,
        scale: Math.random() * 0.3 + 0.7, // Between 0.7 and 1.0
        rotation: Math.random() * 20 - 10, // Between -10 and 10 degrees
        snippet: CODE_SNIPPETS[index % CODE_SNIPPETS.length],
        color: [
          '#3b82f6', // Blue
          '#10b981', // Green
          '#8b5cf6', // Purple
          '#f59e0b', // Amber
          '#ef4444'  // Red
        ][index % 5],
        transformed: false,
        wingPath: WING_PATHS[index % WING_PATHS.length]
      };
    });
    
    setCodeElements(elements);
    
    // Start transformation sequence
    const transformationTimers = elements.map((element, index) => {
      return setTimeout(() => {
        setCodeElements(prev => 
          prev.map(el => 
            el.id === element.id ? { ...el, transformed: true } : el
          )
        );
      }, 2000 + index * 1500); // Staggered transformations
    });
    
    return () => {
      transformationTimers.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {codeElements.map((element) => (
        <motion.div
          key={element.id}
          initial={{ 
            x: element.x, 
            y: element.y, 
            scale: element.scale,
            rotate: element.rotation,
            opacity: 0
          }}
          animate={element.transformed ? {
            x: [element.x, element.x + Math.random() * 200 - 100],
            y: [element.y, element.y - 100 - Math.random() * 200],
            opacity: [1, 0.8, 0],
            scale: [element.scale, element.scale * 0.5],
            rotate: [element.rotation, element.rotation + (Math.random() > 0.5 ? 360 : -360)],
            transition: { 
              duration: 8,
              ease: "easeInOut"
            }
          } : {
            x: element.x,
            y: element.y,
            opacity: 1,
            scale: element.scale,
            rotate: element.rotation,
            transition: { 
              duration: 1,
              ease: "easeOut"
            }
          }}
          className="absolute font-mono text-sm rounded-md overflow-hidden backdrop-blur-sm"
          style={{ 
            maxWidth: '300px',
            transformOrigin: 'center',
            zIndex: 40
          }}
        >
          {!element.transformed ? (
            // Code block view
            <div 
              className="p-3 bg-gray-800/70 text-white whitespace-pre shadow-lg"
              style={{ borderLeft: `3px solid ${element.color}` }}
            >
              {element.snippet}
            </div>
          ) : (
            // Transformed butterfly view
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                transition: { duration: 1 }
              }}
              className="relative"
            >
              <svg width="120" height="100" viewBox="-60 -50 120 100">
                {/* Left wing */}
                <motion.path
                  d={element.wingPath}
                  fill={element.color}
                  opacity={0.7}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: 1,
                    rotate: [-20, 20, -20],
                    transition: { 
                      scale: { duration: 1 },
                      rotate: { 
                        repeat: Infinity, 
                        duration: 1.5,
                        ease: "easeInOut"
                      }
                    }
                  }}
                  style={{ 
                    transformOrigin: 'right center',
                    filter: 'blur(1px)'
                  }}
                />
                
                {/* Right wing (mirrored) */}
                <motion.path
                  d={element.wingPath}
                  fill={element.color}
                  opacity={0.7}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: 1,
                    rotate: [20, -20, 20],
                    transition: { 
                      scale: { duration: 1 },
                      rotate: { 
                        repeat: Infinity, 
                        duration: 1.5,
                        ease: "easeInOut"
                      }
                    }
                  }}
                  style={{ 
                    transformOrigin: 'left center',
                    transform: 'scaleX(-1)',
                    filter: 'blur(1px)'
                  }}
                />
                
                {/* Body */}
                <motion.rect
                  x="-1"
                  y="-20"
                  width="2"
                  height="40"
                  rx="1"
                  fill={element.color}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 0.9,
                    transition: { duration: 1 }
                  }}
                />
              </svg>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingCode; 