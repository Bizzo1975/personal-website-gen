'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CreativeCodeElementProps {
  className?: string;
  width?: number;
  height?: number;
}

// Animation states - using string literals to avoid enum issues
const ANIMATION_STATE = {
  RANDOM_1: 'random1',
  HELLO: 'hello', 
  RANDOM_2: 'random2',
  WORLD: 'world'
};

const CreativeCodeElement: React.FC<CreativeCodeElementProps> = ({
  className = '',
  width = 300,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const animationStateRef = useRef<string>(ANIMATION_STATE.RANDOM_1);
  const stateChangeTimeRef = useRef<number>(Date.now());
  const currentWordRef = useRef<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Check for dark mode on component mount and when theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      if (typeof window !== 'undefined') {
        // Check if browser supports matchMedia
        try {
          if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            setIsDarkMode(darkModeQuery.matches);
            
            // Add listener for theme changes
            const handleThemeChange = (e: MediaQueryListEvent) => {
              setIsDarkMode(e.matches);
            };
            
            // Modern browsers
            darkModeQuery.addEventListener('change', handleThemeChange);
            
            return () => {
              darkModeQuery.removeEventListener('change', handleThemeChange);
            };
          } else {
            // Fallback for browsers that don't support matchMedia
            setIsDarkMode(false);
          }
        } catch (error) {
          console.warn('Dark mode detection failed:', error);
          setIsDarkMode(false);
        }
      }
    };
    
    checkDarkMode();
  }, []);
  
  // Binary matrix effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2D context from canvas');
      return;
    }
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    
    // Binary characters to display (0s and 1s)
    const chars = '01';
    
    // Y position of each column
    const drops: number[] = Array(columns).fill(0);
    
    // Hello World characters for rotation
    const helloWorldChars = "Hello World".split("");
    
    // Base words to display
    const helloBase = "HELLO";
    const worldBase = "WORLD";
    
    // Store the current characters being displayed around the circle
    const circleChars: string[] = Array(6).fill('');
    
    // Function to randomize the case of a string
    const randomizeCase = (str: string): string => {
      return str.split('').map(char => 
        Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()
      ).join('');
    };
    
    // Function to randomly select new characters
    const updateCircleChars = () => {
      for (let i = 0; i < circleChars.length; i++) {
        // 30% chance to update a character
        if (Math.random() < 0.3) {
          circleChars[i] = helloWorldChars[Math.floor(Math.random() * helloWorldChars.length)];
        }
      }
    };
    
    // Initially populate with random Hello World characters
    updateCircleChars();
    
    // Set interval to update characters every 500ms (only during RANDOM states)
    const charUpdateInterval = setInterval(() => {
      if (animationStateRef.current === ANIMATION_STATE.RANDOM_1 ||
          animationStateRef.current === ANIMATION_STATE.RANDOM_2) {
        updateCircleChars();
      }
    }, 500);
    
    // Function to check and update the animation state
    const checkAndUpdateState = () => {
      const now = Date.now();
      const timeInState = now - stateChangeTimeRef.current;
      
      // State transition logic based on time
      switch (animationStateRef.current) {
        case ANIMATION_STATE.RANDOM_1:
          if (timeInState >= 5000) { // 5 seconds of random rotation
            animationStateRef.current = ANIMATION_STATE.HELLO;
            stateChangeTimeRef.current = now;
            
            // Generate randomized case version of "HELLO"
            currentWordRef.current = randomizeCase(helloBase);
          }
          break;
           
        case ANIMATION_STATE.HELLO:
          if (timeInState >= 2000) { // 2 seconds displaying HELLO
            animationStateRef.current = ANIMATION_STATE.RANDOM_2;
            stateChangeTimeRef.current = now;
            currentWordRef.current = '';
            updateCircleChars();
          }
          break;
           
        case ANIMATION_STATE.RANDOM_2:
          if (timeInState >= 5000) { // 5 seconds of random rotation
            animationStateRef.current = ANIMATION_STATE.WORLD;
            stateChangeTimeRef.current = now;
            
            // Generate randomized case version of "WORLD"
            currentWordRef.current = randomizeCase(worldBase);
          }
          break;
           
        case ANIMATION_STATE.WORLD:
          if (timeInState >= 2000) { // 2 seconds displaying WORLD
            animationStateRef.current = ANIMATION_STATE.RANDOM_1;
            stateChangeTimeRef.current = now;
            currentWordRef.current = '';
            updateCircleChars();
          }
          break;
      }
    };
    
    // Draw the animation frame
    const draw = () => {
      // Check if we need to change state
      checkAndUpdateState();
      
      // Slightly translucent black to show trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.fillRect(0, 0, width, height);
      
      // Blue text for matrix effect
      ctx.fillStyle = '#3b82f6';
      ctx.font = `${fontSize}px monospace`;
      
      // For each column
      for (let i = 0; i < columns; i++) {
        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // x = i * fontSize, y = value of drops[i] * fontSize
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        
        // Randomly reset some columns to top
        if (drops[i] * fontSize > height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        
        // Increment y coordinate
        drops[i]++;
      }
      
      // Draw shape in the center
      const centerX = width / 2;
      const centerY = height / 2;
      const time = Date.now() / 1000;
      
      // Draw a pulsating circle
      ctx.beginPath();
      ctx.arc(
        centerX, 
        centerY, 
        Math.sin(time) * 20 + 30, 
        0, 
        Math.PI * 2
      );
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw rotating characters in random mode
      const radius = 50;
      
      if (animationStateRef.current === ANIMATION_STATE.HELLO || 
          animationStateRef.current === ANIMATION_STATE.WORLD) {
        // Display word in the center of the circle
        ctx.font = '24px monospace';
        ctx.fillStyle = '#a855f7'; // Bright purple
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add glow effect for word states
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 15;
        
        // Draw the current word in the middle
        ctx.fillText(currentWordRef.current, centerX, centerY);
      } else {
        // For RANDOM states, show rotating characters
        ctx.font = '20px monospace';
        ctx.fillStyle = '#8b5cf6'; // Normal purple for random mode
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate base angle for rotation
        const baseAngle = time;
        
        for (let i = 0; i < circleChars.length; i++) {
          // Angle calculation for rotation around circle
          const angle = baseAngle + (i * Math.PI / 3);
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.fillText(circleChars[i], 0, 0);
          ctx.restore();
        }
      }
      
      requestRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(requestRef.current);
      clearInterval(charUpdateInterval);
    };
  }, [width, height]);
  
  // Background color based on dark/light mode
  const backgroundColor = isDarkMode 
    ? 'rgba(15, 23, 42, 0.8)'    // Dark blue background for dark mode
    : 'rgba(71, 85, 105, 0.9)';  // Darker gray (slate-600) for light mode
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <canvas
        ref={canvasRef}
        className="rounded-2xl border-0"
        style={{ 
          width: '100%', 
          height: '100%',
          background: backgroundColor,
          border: 'none',
          outline: 'none'
        }}
      />
    </div>
  );
};

export default CreativeCodeElement; 