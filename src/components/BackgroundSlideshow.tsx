'use client';

import { useState, useEffect } from 'react';

interface SlideshowImage {
  id: string;
  url: string;
  altText: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
}

interface BackgroundSlideshowProps {
  interval?: number;
  opacity?: number;
  overlayOpacity?: number;
}

const BackgroundSlideshow: React.FC<BackgroundSlideshowProps> = ({
  interval,
  opacity,
  overlayOpacity
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideImages, setSlideImages] = useState<SlideshowImage[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  const [settings, setSettings] = useState({
    interval: interval || 7000,
    opacity: opacity || 0.15,
    overlayOpacity: overlayOpacity || 0.3,
    autoPlay: true
  });

  // Fallback images if API fails
  const getFallbackImages = (): SlideshowImage[] => {
    return [
      {
        id: 'fallback-1',
        url: '/images/slideshow/coding-1.jpg',
        altText: 'Coding environment with multiple monitors',
        category: 'slideshow',
        displayOrder: 1,
        isActive: true
      },
      {
        id: 'fallback-2',
        url: '/images/slideshow/coding-2.jpg',
        altText: 'Modern development setup',
        category: 'slideshow',
        displayOrder: 2,
        isActive: true
      },
      {
        id: 'fallback-3',
        url: '/images/slideshow/coding-3.jpg',
        altText: 'Programming workspace',
        category: 'slideshow',
        displayOrder: 3,
        isActive: true
      },
      {
        id: 'fallback-4',
        url: '/images/slideshow/coding-4.jpg',
        altText: 'Software development environment',
        category: 'slideshow',
        displayOrder: 4,
        isActive: true
      },
      {
        id: 'fallback-5',
        url: '/images/slideshow/coding-5.jpg',
        altText: 'Tech workspace with laptop',
        category: 'slideshow',
        displayOrder: 5,
        isActive: true
      }
    ];
  };

  // Load slideshow images and settings
  useEffect(() => {
    const loadSlideshowData = async () => {
      try {
        // Fetch images from API
        const response = await fetch('/api/slideshow');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('📸 Loaded slideshow images:', data.length);

        if (data.length > 0) {
          setSlideImages(data);
          setImagesLoaded(data.map(() => false));
        } else {
          // Use fallback images if no images in media library
          const fallbackImages = getFallbackImages();
          setSlideImages(fallbackImages);
          setImagesLoaded(fallbackImages.map(() => false));
        }

        // For now, use default settings - we can add settings endpoint later if needed
        setSettings({
          interval: interval || 7000,
          opacity: opacity || 0.15,
          overlayOpacity: overlayOpacity || 0.3,
          autoPlay: true
        });

      } catch (error) {
        console.error('Error loading slideshow data:', error);
        // Use fallback images on error
        const fallbackImages = getFallbackImages();
        setSlideImages(fallbackImages);
        setImagesLoaded(fallbackImages.map(() => false));
      }
    };

    loadSlideshowData();
  }, [interval, opacity, overlayOpacity]);
  
  // Preload all images when component mounts
  useEffect(() => {
    if (slideImages.length === 0) return;

    const loadImages = async () => {
      const promises = slideImages.map((slideImage, index) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.src = slideImage.url;
          img.onload = () => {
            setImagesLoaded(prev => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load slideshow image: ${slideImage.url}`);
            resolve();
          };
        });
      });
      
      await Promise.all(promises);
    };
    
    loadImages();
  }, [slideImages]);
  
  useEffect(() => {
    if (slideImages.length === 0 || !settings.autoPlay) return;

    // Set up timer for slideshow
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slideImages.length);
    }, settings.interval);
    
    // Clean up timer on unmount
    return () => clearInterval(timer);
  }, [slideImages.length, settings.interval, settings.autoPlay]);

  // Don't render if no images
  if (slideImages.length === 0) {
    return null;
  }
  
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
      {slideImages.map((slideImage, index) => (
        <div
          key={slideImage.id}
          className="absolute inset-0 w-full h-full transition-opacity duration-1500"
          style={{
            opacity: currentSlide === index ? settings.opacity : 0,
          }}
        >
          <img
            src={slideImage.url}
            alt={slideImage.altText}
            width="auto"
            height="auto"
            className="w-full h-full transition-opacity duration-300"
            style={{ objectFit: 'cover' }}
            loading={index === 0 || index === 1 ? 'eager' : 'lazy'}
          />
        </div>
      ))}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/20" 
        style={{ opacity: settings.overlayOpacity }}
      />
    </div>
  );
};

export default BackgroundSlideshow; 