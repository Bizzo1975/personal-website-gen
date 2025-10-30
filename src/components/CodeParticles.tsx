'use client';

import React, { useEffect, useRef } from 'react';

interface CodeParticle {
  x: number;
  y: number;
  size: number;
  value: string;
  color: string;
  speed: number;
  opacity: number;
  rotationSpeed: number;
  rotation: number;
}

interface CodeParticlesProps {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  count?: number;
  minSize?: number;
  maxSize?: number;
}

// Possible code elements to display
const CODE_ELEMENTS = [
  '{}', '()', '[]', '<>', '//', '/*', '*/',
  '0', '1', '10', '01', 'if', 'for', '==', '===',
  '=>', '&&', '||', '+=', '::', '...', ';'
];

const CodeParticles: React.FC<CodeParticlesProps> = ({
  className = '',
  primaryColor = '#3b82f6',
  secondaryColor = '#10b981',
  count = 40,
  minSize = 10,
  maxSize = 24,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<CodeParticle[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: -100, y: -100 });

  // Initialize code particles
  useEffect(() => {
    // Only run on client side to prevent hydration issues
    if (typeof window === 'undefined') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create particles
    particlesRef.current = Array.from({ length: count }, () => {
      const size = Math.random() * (maxSize - minSize) + minSize;
      const speed = Math.random() * 0.5 + 0.1; // Between 0.1 and 0.6
      const opacity = Math.random() * 0.6 + 0.2; // Between 0.2 and 0.8
      const rotationSpeed = (Math.random() - 0.5) * 0.02; // Random rotation speed
      const value = CODE_ELEMENTS[Math.floor(Math.random() * CODE_ELEMENTS.length)];
      const color = Math.random() > 0.7 ? secondaryColor : primaryColor;
      
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size,
        value,
        color,
        speed,
        opacity,
        rotationSpeed,
        rotation: Math.random() * Math.PI * 2,
      };
    });

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // Handle touch movement
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('mouseleave', () => {
      mouseRef.current = { x: -100, y: -100 };
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.cancelAnimationFrame(animationRef.current);
    };
  }, [count, maxSize, minSize, primaryColor, secondaryColor]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Move particle
        particle.y += particle.speed;
        particle.rotation += particle.rotationSpeed;
        
        // Reset when particle goes off-screen
        if (particle.y > canvas.height) {
          particle.y = -particle.size;
          particle.x = Math.random() * canvas.width;
        }
        
        // Mouse interaction - particles are attracted to mouse
        const mouseDistance = Math.sqrt(
          Math.pow(particle.x - mouseRef.current.x, 2) + 
          Math.pow(particle.y - mouseRef.current.y, 2)
        );
        
        if (mouseDistance < 150) {
          // Attract particles to mouse
          const angle = Math.atan2(
            mouseRef.current.y - particle.y,
            mouseRef.current.x - particle.x
          );
          
          particle.x += Math.cos(angle) * 0.5;
          particle.y += Math.sin(angle) * 0.5;
          
          // Increase opacity when near mouse
          particle.opacity = Math.min(0.9, particle.opacity + 0.01);
        } else {
          // Return to normal opacity
          particle.opacity = Math.max(0.2, particle.opacity - 0.005);
        }
        
        // Draw text
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.font = `${particle.size}px monospace`;
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.value, 0, 0);
        ctx.restore();
      });
      
      animationRef.current = window.requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.cancelAnimationFrame(animationRef.current);
    };
  }, [primaryColor, secondaryColor]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full pointer-events-auto"
        style={{ opacity: 0.5 }}
      />
    </div>
  );
};

export default CodeParticles; 