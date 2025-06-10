'use client';

import { useState, useEffect } from 'react';
import FallbackImage from './FallbackImage';

// Array of development-related images
const slideImages = [
  '/images/slideshow/coding-1.jpg',
  '/images/slideshow/coding-2.jpg',
  '/images/slideshow/coding-3.jpg',
  '/images/slideshow/coding-4.jpg',
  '/images/slideshow/coding-5.jpg',
];

interface BackgroundSlideshowProps {
  interval?: number;
  opacity?: number;
  overlayOpacity?: number;
}

const BackgroundSlideshow: React.FC<BackgroundSlideshowProps> = ({
  interval = 7000,
  opacity = 0.15,
  overlayOpacity = 0.3
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(slideImages.map(() => false));
  
  // Preload all images when component mounts
  useEffect(() => {
    const loadImages = async () => {
      const promises = slideImages.map((src, index) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => {
            setImagesLoaded(prev => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load slideshow image: ${src}`);
            resolve();
          };
        });
      });
      
      await Promise.all(promises);
    };
    
    loadImages();
  }, []);
  
  useEffect(() => {
    // Set up timer for slideshow
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slideImages.length);
    }, interval);
    
    // Clean up timer on unmount
    return () => clearInterval(timer);
  }, [interval]);
  
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
      {slideImages.map((src, index) => (
        <div
          key={src}
          className="absolute inset-0 w-full h-full transition-opacity duration-1500"
          style={{
            opacity: currentSlide === index ? opacity : 0,
          }}
        >
          <FallbackImage
            src={src}
            alt={`Background slide ${index + 1}`}
            className="w-full h-full"
            objectFit="cover"
            priority={index === 0 || index === 1} // Prioritize the first two images
            fallbackSrc="/images/placeholder.jpg"
          />
        </div>
      ))}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/20" 
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
};

export default BackgroundSlideshow; 