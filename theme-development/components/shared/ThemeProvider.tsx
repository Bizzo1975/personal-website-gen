'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeType, ThemeConfig, ThemeContextType } from '../../types/theme';
import { themeConfigs } from '../../config/themes';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default');
  const [isLoading, setIsLoading] = useState(true);

  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
    // Load theme assets
    loadThemeAssets(theme);
    // Apply theme to document
    applyThemeToDocument(theme);
  };

  const loadThemeAssets = async (theme: ThemeType) => {
    setIsLoading(true);
    try {
      const config = themeConfigs[theme];
      if (!config) {
        console.warn(`Theme config not found for theme: ${theme}`);
        return;
      }
      // Load fonts
      await loadFonts(config.fonts);
      // Load sounds
      await loadSounds(config.sounds);
      // Load images
      await loadImages(config.assets.images);
    } catch (error) {
      console.error('Failed to load theme assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFonts = async (fonts: any) => {
    // Font loading logic would go here
    // For now, we'll just simulate loading
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const loadSounds = async (sounds: any) => {
    // Sound loading logic would go here
    // For now, we'll just simulate loading
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const loadImages = async (images: string[]) => {
    // Image loading logic would go here
    // For now, we'll just simulate loading
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const applyThemeToDocument = (theme: ThemeType) => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const config = themeConfigs[theme];
    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(config.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Apply theme class
    root.className = `theme-${theme}`;
  };

  useEffect(() => {
    // Initialize with default theme
    setTheme('default');
  }, []);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme,
      themeConfig: themeConfigs[currentTheme],
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
