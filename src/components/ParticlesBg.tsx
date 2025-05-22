'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  direction: number;
  opacity: number;
}

interface ParticlesBgProps {
  className?: string;
  color?: string;
  count?: number;
  minSize?: number;
  maxSize?: number;
  minSpeed?: number;
  maxSpeed?: number;
}

const ParticlesBg: React.FC<ParticlesBgProps> = ({
  className = '',
  color = '#3b82f6', // Default blue color
  count = 50,
  minSize = 2,
  maxSize = 5,
  minSpeed = 0.1,
  maxSpeed = 0.3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: -100, y: -100 });

  // Initialize particles
  useEffect(() => {
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
      const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
      const opacity = Math.random() * 0.5 + 0.2; // Between 0.2 and 0.7
      
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size,
        color,
        speed,
        direction: Math.random() * Math.PI * 2, // Random direction in radians
        opacity,
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
  }, [color, count, maxSize, minSize, maxSpeed, minSpeed]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections between particles
      ctx.beginPath();
      ctx.strokeStyle = `${color}20`; // Very transparent color
      
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p1 = particlesRef.current[i];
        
        // Connect nearby particles
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p2 = particlesRef.current[j];
          const distance = Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
          );
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `${color}${Math.floor((1 - distance / 100) * 20).toString(16)}`;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      
      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Move particle
        particle.x += Math.cos(particle.direction) * particle.speed;
        particle.y += Math.sin(particle.direction) * particle.speed;
        
        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Mouse interaction - particles flee from mouse
        const mouseDistance = Math.sqrt(
          Math.pow(particle.x - mouseRef.current.x, 2) + 
          Math.pow(particle.y - mouseRef.current.y, 2)
        );
        
        if (mouseDistance < 100) {
          // Calculate angle away from mouse
          const angle = Math.atan2(
            particle.y - mouseRef.current.y,
            particle.x - mouseRef.current.x
          );
          
          // Gradually adjust direction to flee from mouse
          particle.direction = angle;
          particle.speed = maxSpeed * 2; // Temporary speed boost
        } else {
          // Return to normal speed
          particle.speed = Math.max(particle.speed * 0.95, minSpeed);
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.floor(particle.opacity * 255).toString(16)}`;
        ctx.fill();
      });
      
      animationRef.current = window.requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.cancelAnimationFrame(animationRef.current);
    };
  }, [color, maxSpeed, minSpeed]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full pointer-events-auto"
        style={{ opacity: 0.7 }}
      />
    </div>
  );
};

export default ParticlesBg; 