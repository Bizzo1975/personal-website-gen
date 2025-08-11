# Theme Development Setup
## Isolated Development Environment

---

## Overview

This guide outlines how to set up an isolated development environment for building the comic book and Star Trek themes without affecting the current website. This approach allows us to:

- Develop themes independently
- Test components in isolation
- Iterate quickly without breaking existing functionality
- Create a theme showcase/demo page
- Validate concepts before full integration

---

## Development Structure

### 1. Theme Development Directory
```
theme-development/
├── components/
│   ├── comic/
│   │   ├── ComicPanel.tsx
│   │   ├── SpeechBubble.tsx
│   │   ├── ComicNavigation.tsx
│   │   ├── SoundEffect.tsx
│   │   └── ComicLayout.tsx
│   ├── startrek/
│   │   ├── LCARSPanel.tsx
│   │   ├── HolographicDisplay.tsx
│   │   ├── ComputerVoice.tsx
│   │   ├── StarTrekNavigation.tsx
│   │   └── LCARSLayout.tsx
│   └── shared/
│       ├── ThemeProvider.tsx
│       ├── ThemeSwitcher.tsx
│       └── AssetLoader.tsx
├── styles/
│   ├── themes/
│   │   ├── comic-book.css
│   │   ├── star-trek.css
│   │   └── animations.css
│   └── globals.css
├── hooks/
│   ├── useTheme.ts
│   ├── useSoundEffects.ts
│   └── useComputerVoice.ts
├── services/
│   ├── ai/
│   │   └── ImageGenerator.ts
│   ├── audio/
│   │   ├── ComicSoundEffects.ts
│   │   └── StarTrekSounds.ts
│   └── AssetManager.ts
├── types/
│   └── theme.ts
├── demo/
│   ├── ComicBookDemo.tsx
│   ├── StarTrekDemo.tsx
│   └── ThemeShowcase.tsx
├── assets/
│   ├── fonts/
│   ├── sounds/
│   └── images/
└── package.json
```

### 2. Theme Configuration System
```typescript
// types/theme.ts
export type ThemeType = 'default' | 'comic' | 'startrek';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  description: string;
  colors: ColorPalette;
  fonts: FontConfig;
  animations: AnimationConfig;
  sounds: SoundConfig;
  layout: LayoutConfig;
  assets: AssetConfig;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  panel: string;
  border: string;
  muted: string;
  [key: string]: string;
}

export interface FontConfig {
  heading: string;
  body: string;
  display?: string;
  accent?: string;
}

export interface AnimationConfig {
  pageTransition: string;
  contentReveal: string;
  interactive: string;
  background: string;
}

export interface SoundConfig {
  enabled: boolean;
  effects: string[];
  ambient?: string;
  voice?: string;
}

export interface LayoutConfig {
  type: 'comic-panel' | 'lcars' | 'default';
  grid: string;
  spacing: string;
  borderRadius: string;
}

export interface AssetConfig {
  fonts: string[];
  sounds: string[];
  images: string[];
  animations: string[];
}
```

---

## Implementation Plan

### Phase 1: Core Theme Infrastructure (Week 1)

#### 1.1 Theme Provider Setup
```typescript
// components/shared/ThemeProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeType, ThemeConfig } from '../../types/theme';
import { themeConfigs } from '../../config/themes';

interface ThemeContextType {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themeConfig: ThemeConfig;
  isLoading: boolean;
}

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

  const applyThemeToDocument = (theme: ThemeType) => {
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
```

#### 1.2 Theme Configuration
```typescript
// config/themes/index.ts
import { ThemeConfig } from '../../types/theme';

export const themeConfigs: Record<string, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Default Theme',
    description: 'Clean, modern design',
    colors: {
      primary: '#10b981',
      secondary: '#3b82f6',
      accent: '#8b5cf6',
      background: '#ffffff',
      foreground: '#1f2937',
      panel: '#f9fafb',
      border: '#e5e7eb',
      muted: '#6b7280'
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    },
    animations: {
      pageTransition: 'fade',
      contentReveal: 'slide-up',
      interactive: 'scale',
      background: 'none'
    },
    sounds: {
      enabled: false,
      effects: []
    },
    layout: {
      type: 'default',
      grid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      spacing: 'gap-6',
      borderRadius: 'rounded-lg'
    },
    assets: {
      fonts: [],
      sounds: [],
      images: [],
      animations: []
    }
  },
  comic: {
    id: 'comic',
    name: 'Superman Comic Book',
    description: 'Golden Age comic book aesthetic',
    colors: {
      primary: '#FF0000',    // Superman red
      secondary: '#0066CC',  // Superman blue
      accent: '#FFD700',     // Golden yellow
      background: '#FFFFFF',
      foreground: '#000000',
      panel: '#F0F0F0',
      border: '#000000',
      muted: '#666666',
      speechBubble: '#FFFFFF',
      thoughtCloud: '#E8F4FD',
      soundEffect: '#FF0000'
    },
    fonts: {
      heading: 'Action Comics, serif',
      body: 'Comic Sans MS, sans-serif',
      display: 'Impact, sans-serif'
    },
    animations: {
      pageTransition: 'comic-page-turn',
      contentReveal: 'panel-reveal',
      interactive: 'pow-effect',
      background: 'halftone-pattern'
    },
    sounds: {
      enabled: true,
      effects: ['pow', 'bam', 'zap', 'boom', 'wham']
    },
    layout: {
      type: 'comic-panel',
      grid: 'comic-grid',
      spacing: 'comic-spacing',
      borderRadius: 'comic-border'
    },
    assets: {
      fonts: ['action-comics', 'comic-book'],
      sounds: ['pow.mp3', 'bam.mp3', 'zap.mp3'],
      images: ['comic-pattern.png', 'halftone.png'],
      animations: ['page-turn', 'panel-reveal']
    }
  },
  startrek: {
    id: 'startrek',
    name: 'Star Trek LCARS',
    description: 'Computer console interface',
    colors: {
      primary: '#FF6600',    // LCARS orange
      secondary: '#0066CC',  // LCARS blue
      accent: '#CCCCCC',     // LCARS gray
      background: '#000000',
      foreground: '#FFFFFF',
      panel: '#1A1A1A',
      border: '#333333',
      muted: '#666666',
      alert: '#FF0000',
      status: '#00FF00',
      warning: '#FFFF00'
    },
    fonts: {
      heading: 'Federation Standard, monospace',
      body: 'Computer Terminal, monospace',
      display: 'LCARS Display, monospace'
    },
    animations: {
      pageTransition: 'holographic-fade',
      contentReveal: 'scanning-line',
      interactive: 'computer-beep',
      background: 'circuit-pattern'
    },
    sounds: {
      enabled: true,
      effects: ['beep', 'alert', 'scan'],
      voice: 'computer-voice'
    },
    layout: {
      type: 'lcars',
      grid: 'lcars-grid',
      spacing: 'lcars-spacing',
      borderRadius: 'lcars-border'
    },
    assets: {
      fonts: ['federation-standard', 'computer-terminal'],
      sounds: ['beep.mp3', 'alert.mp3', 'scan.mp3'],
      images: ['lcars-pattern.png', 'circuit-board.png'],
      animations: ['scanning', 'holographic']
    }
  }
};
```

### Phase 2: Comic Book Theme Components (Week 2)

#### 2.1 Comic Panel Component
```typescript
// components/comic/ComicPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComicPanelProps {
  children: React.ReactNode;
  panelType?: 'main' | 'sidebar' | 'full-width';
  borderStyle?: 'solid' | 'dashed' | 'halftone';
  animation?: 'slide-in' | 'zoom-in' | 'fade-in' | 'page-turn';
  delay?: number;
  className?: string;
}

const ComicPanel: React.FC<ComicPanelProps> = ({
  children,
  panelType = 'main',
  borderStyle = 'solid',
  animation = 'slide-in',
  delay = 0,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationVariants = () => {
    switch (animation) {
      case 'slide-in':
        return {
          hidden: { x: -100, opacity: 0 },
          visible: { x: 0, opacity: 1 }
        };
      case 'zoom-in':
        return {
          hidden: { scale: 0.8, opacity: 0 },
          visible: { scale: 1, opacity: 1 }
        };
      case 'fade-in':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
      case 'page-turn':
        return {
          hidden: { rotateY: -90, opacity: 0 },
          visible: { rotateY: 0, opacity: 1 }
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`comic-panel comic-panel-${panelType} comic-border-${borderStyle} ${className}`}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={getAnimationVariants()}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="comic-panel-content">
            {children}
          </div>
          <div className="comic-panel-border"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComicPanel;
```

#### 2.2 Speech Bubble Component
```typescript
// components/comic/SpeechBubble.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SpeechBubbleProps {
  text: string;
  type?: 'speech' | 'thought' | 'narrative';
  character?: string;
  emotion?: 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  type = 'speech',
  character,
  emotion = 'neutral',
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const getBubbleStyle = () => {
    const baseStyle = `speech-bubble speech-${type} emotion-${emotion} position-${position}`;
    return `${baseStyle} ${className}`;
  };

  return (
    <motion.div
      className={getBubbleStyle()}
      initial={{ scale: 0, opacity: 0 }}
      animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {character && (
        <div className="character-name">
          {character}
        </div>
      )}
      <div className="bubble-text">
        {text}
      </div>
      <div className={`bubble-tail tail-${position}`}></div>
    </motion.div>
  );
};

export default SpeechBubble;
```

### Phase 3: Star Trek Theme Components (Week 3)

#### 3.1 LCARS Panel Component
```typescript
// components/startrek/LCARSPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LCARSPanelProps {
  children: React.ReactNode;
  panelType?: 'main' | 'sidebar' | 'status' | 'alert';
  color?: 'orange' | 'blue' | 'gray' | 'red' | 'green';
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  className?: string;
}

const LCARSPanel: React.FC<LCARSPanelProps> = ({
  children,
  panelType = 'main',
  color = 'orange',
  size = 'medium',
  interactive = false,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(false);
  const [scanLine, setScanLine] = useState(false);

  useEffect(() => {
    if (interactive) {
      const interval = setInterval(() => {
        setScanLine(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [interactive]);

  const handleClick = () => {
    if (interactive) {
      setIsActive(!isActive);
      // Play computer beep sound
      playComputerBeep();
    }
  };

  const playComputerBeep = () => {
    // Implementation for computer beep sound
    console.log('Computer beep sound played');
  };

  return (
    <motion.div
      className={`lcars-panel lcars-${panelType} lcars-${color} lcars-${size} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={handleClick}
      whileHover={interactive ? { scale: 1.02 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
    >
      <div className="lcars-content">
        {children}
      </div>
      <div className="lcars-border"></div>
      {scanLine && (
        <div className="scanning-line"></div>
      )}
      {isActive && (
        <div className="lcars-active-indicator"></div>
      )}
    </motion.div>
  );
};

export default LCARSPanel;
```

#### 3.2 Holographic Display Component
```typescript
// components/startrek/HolographicDisplay.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface HolographicDisplayProps {
  children: React.ReactNode;
  type?: 'projection' | 'status' | 'alert';
  intensity?: number;
  flicker?: boolean;
  autoRotate?: boolean;
  className?: string;
}

const HolographicDisplay: React.FC<HolographicDisplayProps> = ({
  children,
  type = 'projection',
  intensity = 1,
  flicker = false,
  autoRotate = false,
  className = ''
}) => {
  const [flickerState, setFlickerState] = useState(false);

  useEffect(() => {
    if (flicker) {
      const interval = setInterval(() => {
        setFlickerState(prev => !prev);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [flicker]);

  return (
    <motion.div
      className={`hologram hologram-${type} intensity-${intensity} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      animate={autoRotate ? { rotateY: 360 } : {}}
      transition={autoRotate ? { duration: 20, repeat: Infinity, ease: "linear" } : {}}
    >
      {flicker && (
        <div className={`hologram-flicker ${flickerState ? 'active' : ''}`}></div>
      )}
      <div className="hologram-content">
        {children}
      </div>
      <div className="hologram-glow"></div>
    </motion.div>
  );
};

export default HolographicDisplay;
```

### Phase 4: Demo Pages (Week 4)

#### 4.1 Theme Showcase
```typescript
// demo/ThemeShowcase.tsx
'use client';

import React from 'react';
import { useTheme } from '../hooks/useTheme';
import ComicBookDemo from './ComicBookDemo';
import StarTrekDemo from './StarTrekDemo';
import DefaultDemo from './DefaultDemo';

const ThemeShowcase: React.FC = () => {
  const { currentTheme, setTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading theme...</p>
      </div>
    );
  }

  const renderDemo = () => {
    switch (currentTheme) {
      case 'comic':
        return <ComicBookDemo />;
      case 'startrek':
        return <StarTrekDemo />;
      default:
        return <DefaultDemo />;
    }
  };

  return (
    <div className="theme-showcase">
      <header className="showcase-header">
        <h1>Dynamic Theme System</h1>
        <div className="theme-selector">
          <button
            className={`theme-btn ${currentTheme === 'default' ? 'active' : ''}`}
            onClick={() => setTheme('default')}
          >
            Default
          </button>
          <button
            className={`theme-btn ${currentTheme === 'comic' ? 'active' : ''}`}
            onClick={() => setTheme('comic')}
          >
            Comic Book
          </button>
          <button
            className={`theme-btn ${currentTheme === 'startrek' ? 'active' : ''}`}
            onClick={() => setTheme('startrek')}
          >
            Star Trek
          </button>
        </div>
      </header>
      
      <main className="showcase-content">
        {renderDemo()}
      </main>
    </div>
  );
};

export default ThemeShowcase;
```

---

## Development Commands

### Setup Commands
```bash
# Create theme development directory
mkdir theme-development
cd theme-development

# Initialize package.json
npm init -y

# Install dependencies
npm install react react-dom next typescript
npm install framer-motion @types/react @types/react-dom
npm install tailwindcss postcss autoprefixer
npm install --save-dev @types/node

# Initialize Tailwind CSS
npx tailwindcss init -p
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

---

## Integration Strategy

### Phase 1: Isolated Development (Weeks 1-4)
- Build theme components independently
- Create demo pages for testing
- Develop theme switching logic
- Test animations and interactions

### Phase 2: Integration Preparation (Week 5)
- Create integration utilities
- Develop theme migration scripts
- Prepare database schema updates
- Create theme asset management system

### Phase 3: Gradual Integration (Week 6)
- Integrate theme provider into main app
- Add theme switcher to existing components
- Test theme switching with current content
- Optimize performance and loading

### Phase 4: Full Integration (Week 7)
- Replace default components with theme-aware versions
- Add theme-specific content and assets
- Implement AI generation integration
- Final testing and optimization

---

## Benefits of This Approach

1. **Risk Mitigation**: No impact on current website during development
2. **Rapid Iteration**: Quick testing and refinement of theme concepts
3. **Component Isolation**: Each theme component can be developed independently
4. **Demo Capability**: Create impressive demos before full integration
5. **Easy Rollback**: Can easily revert if issues arise during integration
6. **Parallel Development**: Multiple developers can work on different themes
7. **Testing**: Comprehensive testing before affecting production code

This approach ensures we can build robust, well-tested themes before integrating them into your main website, minimizing risk while maximizing quality.
