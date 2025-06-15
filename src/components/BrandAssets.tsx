'use client';

import React, { useState, useRef } from 'react';
import { Icon } from './IconSystem';

// Brand color palette
export const brandColors = {
  primary: {
    light: '#10b981', // Emerald-500
    dark: '#0ea5e9',  // Sky-500
    rgb: {
      light: '16 185 129',
      dark: '14 165 233'
    }
  },
  secondary: {
    light: '#0ea5e9', // Sky-500
    dark: '#1e3a8a',  // Blue-800
    rgb: {
      light: '14 165 233',
      dark: '30 58 138'
    }
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },
  accent: {
    emerald: '#10b981',
    sky: '#0ea5e9',
    purple: '#8b5cf6',
    amber: '#f59e0b',
    red: '#ef4444'
  }
};

// Logo component with variations
interface LogoProps {
  variant?: 'full' | 'icon' | 'text' | 'minimal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  theme = 'auto',
  className = '',
  animated = false
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24'
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  };

  const getThemeColors = () => {
    if (theme === 'light') {
      return {
        primary: brandColors.primary.light,
        secondary: brandColors.secondary.light
      };
    } else if (theme === 'dark') {
      return {
        primary: brandColors.primary.dark,
        secondary: brandColors.secondary.dark
      };
    } else {
      // Auto theme - use CSS variables
      return {
        primary: 'rgb(var(--primary))',
        secondary: 'rgb(var(--secondary))'
      };
    }
  };

  const colors = getThemeColors();

  const LogoIcon = () => (
    <svg
      className={`${sizeClasses[size]} ${animated ? 'animate-pulse' : ''}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer diamond shape */}
      <path
        d="M50 5 L85 50 L50 95 L15 50 Z"
        fill={colors.primary}
        className="transition-colors duration-300"
      />
      
      {/* Inner geometric pattern */}
      <path
        d="M50 20 L70 50 L50 80 L30 50 Z"
        fill={colors.secondary}
        className="transition-colors duration-300"
      />
      
      {/* Center accent */}
      <circle
        cx="50"
        cy="50"
        r="8"
        fill="white"
        className="transition-colors duration-300"
      />
      
      {/* Initials */}
      <text
        x="50"
        y="55"
        textAnchor="middle"
        className="fill-current text-xs font-bold"
        style={{ fill: colors.primary }}
      >
        JLK
      </text>
    </svg>
  );

  const LogoText = () => (
    <span
      className={`${textSizes[size]} font-bold tracking-tight ${className}`}
      style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}
    >
      Jonathan L Keck
    </span>
  );

  const renderLogo = () => {
    switch (variant) {
      case 'icon':
        return <LogoIcon />;
      
      case 'text':
        return <LogoText />;
      
      case 'minimal':
        return (
          <div className={`flex items-center space-x-2 ${className}`}>
            <div className={`${sizeClasses[size]} relative`}>
              <div
                className="w-full h-full rounded-lg"
                style={{ backgroundColor: colors.primary }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs"
              >
                JLK
              </span>
            </div>
          </div>
        );
      
      case 'full':
      default:
        return (
          <div className={`flex items-center space-x-3 ${className}`}>
            <LogoIcon />
            <LogoText />
          </div>
        );
    }
  };

  return renderLogo();
};

// Brand guidelines component
interface BrandGuidelinesProps {
  section?: 'colors' | 'typography' | 'logos' | 'usage' | 'all';
}

export const BrandGuidelines: React.FC<BrandGuidelinesProps> = ({
  section = 'all'
}) => {
  const [activeSection, setActiveSection] = useState(section);

  const ColorPalette = () => (
    <div className="space-y-6">
      <h3 className="heading-3">Color Palette</h3>
      
      {/* Primary Colors */}
      <div>
        <h4 className="heading-4 mb-3">Primary Colors</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div
              className="w-full h-20 rounded-lg border"
              style={{ backgroundColor: brandColors.primary.light }}
            />
            <div className="text-sm">
              <p className="font-medium">Light Mode Primary</p>
              <p className="text-tertiary">{brandColors.primary.light}</p>
              <p className="text-tertiary">RGB: {brandColors.primary.rgb.light}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div
              className="w-full h-20 rounded-lg border"
              style={{ backgroundColor: brandColors.primary.dark }}
            />
            <div className="text-sm">
              <p className="font-medium">Dark Mode Primary</p>
              <p className="text-tertiary">{brandColors.primary.dark}</p>
              <p className="text-tertiary">RGB: {brandColors.primary.rgb.dark}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Colors */}
      <div>
        <h4 className="heading-4 mb-3">Secondary Colors</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div
              className="w-full h-20 rounded-lg border"
              style={{ backgroundColor: brandColors.secondary.light }}
            />
            <div className="text-sm">
              <p className="font-medium">Light Mode Secondary</p>
              <p className="text-tertiary">{brandColors.secondary.light}</p>
              <p className="text-tertiary">RGB: {brandColors.secondary.rgb.light}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div
              className="w-full h-20 rounded-lg border"
              style={{ backgroundColor: brandColors.secondary.dark }}
            />
            <div className="text-sm">
              <p className="font-medium">Dark Mode Secondary</p>
              <p className="text-tertiary">{brandColors.secondary.dark}</p>
              <p className="text-tertiary">RGB: {brandColors.secondary.rgb.dark}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Neutral Colors */}
      <div>
        <h4 className="heading-4 mb-3">Neutral Colors</h4>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(brandColors.neutral).map(([shade, color]) => (
            <div key={shade} className="space-y-1">
              <div
                className="w-full h-12 rounded border"
                style={{ backgroundColor: color }}
              />
              <div className="text-xs text-center">
                <p className="font-medium">{shade}</p>
                <p className="text-tertiary">{color}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accent Colors */}
      <div>
        <h4 className="heading-4 mb-3">Accent Colors</h4>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(brandColors.accent).map(([name, color]) => (
            <div key={name} className="space-y-2">
              <div
                className="w-full h-16 rounded-lg border"
                style={{ backgroundColor: color }}
              />
              <div className="text-sm text-center">
                <p className="font-medium capitalize">{name}</p>
                <p className="text-tertiary">{color}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TypographyGuide = () => (
    <div className="space-y-6">
      <h3 className="heading-3">Typography</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="heading-4">Font Families</h4>
          <div className="space-y-2 mt-2">
            <p className="text-body">
              <span className="font-medium">Primary:</span> Inter (Sans-serif)
            </p>
            <p className="text-body font-mono">
              <span className="font-medium">Monospace:</span> JetBrains Mono
            </p>
          </div>
        </div>

        <div>
          <h4 className="heading-4">Heading Hierarchy</h4>
          <div className="space-y-3 mt-2">
            <div className="heading-display">Display Heading</div>
            <div className="heading-1">Heading 1</div>
            <div className="heading-2">Heading 2</div>
            <div className="heading-3">Heading 3</div>
            <div className="heading-4">Heading 4</div>
            <div className="heading-5">Heading 5</div>
            <div className="heading-6">Heading 6</div>
          </div>
        </div>

        <div>
          <h4 className="heading-4">Body Text</h4>
          <div className="space-y-2 mt-2">
            <p className="text-lead">Lead text for introductions and important content.</p>
            <p className="text-body-large">Large body text for emphasis.</p>
            <p className="text-body">Regular body text for main content.</p>
            <p className="text-body-small">Small body text for secondary information.</p>
            <p className="text-caption">Caption text for labels and metadata.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const LogoVariations = () => (
    <div className="space-y-6">
      <h3 className="heading-3">Logo Variations</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="heading-4">Full Logo</h4>
          <div className="p-6 border rounded-lg bg-surface-primary">
            <Logo variant="full" size="lg" />
          </div>
          <div className="p-6 border rounded-lg bg-surface-inverse">
            <Logo variant="full" size="lg" theme="dark" />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="heading-4">Icon Only</h4>
          <div className="p-6 border rounded-lg bg-surface-primary">
            <Logo variant="icon" size="lg" />
          </div>
          <div className="p-6 border rounded-lg bg-surface-inverse">
            <Logo variant="icon" size="lg" theme="dark" />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="heading-4">Text Only</h4>
          <div className="p-6 border rounded-lg bg-surface-primary">
            <Logo variant="text" size="lg" />
          </div>
          <div className="p-6 border rounded-lg bg-surface-inverse">
            <Logo variant="text" size="lg" theme="dark" />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="heading-4">Minimal</h4>
          <div className="p-6 border rounded-lg bg-surface-primary">
            <Logo variant="minimal" size="lg" />
          </div>
          <div className="p-6 border rounded-lg bg-surface-inverse">
            <Logo variant="minimal" size="lg" theme="dark" />
          </div>
        </div>
      </div>
    </div>
  );

  const UsageGuidelines = () => (
    <div className="space-y-6">
      <h3 className="heading-3">Usage Guidelines</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="heading-4">Logo Usage</h4>
          <ul className="list-disc list-inside space-y-1 text-body">
            <li>Maintain minimum clear space around the logo</li>
            <li>Use appropriate contrast for background colors</li>
            <li>Don't stretch, skew, or distort the logo</li>
            <li>Use the correct logo variation for the context</li>
            <li>Ensure legibility at all sizes</li>
          </ul>
        </div>

        <div>
          <h4 className="heading-4">Color Usage</h4>
          <ul className="list-disc list-inside space-y-1 text-body">
            <li>Primary colors for main brand elements</li>
            <li>Secondary colors for accents and highlights</li>
            <li>Neutral colors for text and backgrounds</li>
            <li>Maintain WCAG AA contrast ratios</li>
            <li>Use semantic colors for status indicators</li>
          </ul>
        </div>

        <div>
          <h4 className="heading-4">Typography Usage</h4>
          <ul className="list-disc list-inside space-y-1 text-body">
            <li>Use Inter for all UI and content text</li>
            <li>Use JetBrains Mono for code and technical content</li>
            <li>Maintain proper heading hierarchy</li>
            <li>Ensure adequate line spacing for readability</li>
            <li>Use appropriate font weights for emphasis</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const sections = {
    colors: <ColorPalette />,
    typography: <TypographyGuide />,
    logos: <LogoVariations />,
    usage: <UsageGuidelines />,
    all: (
      <div className="space-y-12">
        <ColorPalette />
        <TypographyGuide />
        <LogoVariations />
        <UsageGuidelines />
      </div>
    )
  };

  if (section !== 'all') {
    return sections[activeSection as keyof typeof sections];
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-primary">
        <nav className="flex space-x-8">
          {Object.keys(sections).filter(key => key !== 'all').map((sectionKey) => (
            <button
              key={sectionKey}
              onClick={() => setActiveSection(sectionKey as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeSection === sectionKey
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              {sectionKey}
            </button>
          ))}
        </nav>
      </div>
      
      {sections[activeSection as keyof typeof sections]}
    </div>
  );
};

// Favicon generator component
export const FaviconGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generatedFavicons, setGeneratedFavicons] = useState<string[]>([]);

  const generateFavicon = (size: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, brandColors.primary.light);
    gradient.addColorStop(1, brandColors.secondary.light);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Draw initials
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.4}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('JLK', size / 2, size / 2);

    return canvas.toDataURL('image/png');
  };

  const generateAllFavicons = () => {
    const sizes = [16, 32, 48, 64, 128, 256];
    const favicons = sizes.map(size => generateFavicon(size));
    setGeneratedFavicons(favicons);
  };

  const downloadFavicon = (dataUrl: string, size: number) => {
    const link = document.createElement('a');
    link.download = `favicon-${size}x${size}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="heading-3">Favicon Generator</h3>
        <button
          onClick={generateAllFavicons}
          className="interactive-primary text-white px-4 py-2 rounded-lg"
        >
          Generate Favicons
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {generatedFavicons.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {generatedFavicons.map((favicon, index) => {
            const size = [16, 32, 48, 64, 128, 256][index];
            return (
              <div key={size} className="text-center space-y-2">
                <div className="border rounded-lg p-4 bg-surface-secondary">
                  <img
                    src={favicon}
                    alt={`Favicon ${size}x${size}`}
                    className="mx-auto"
                    style={{ width: Math.min(size, 64), height: Math.min(size, 64) }}
                  />
                </div>
                <div className="text-sm">
                  <p className="font-medium">{size}×{size}</p>
                  <button
                    onClick={() => downloadFavicon(favicon, size)}
                    className="text-primary hover:text-primary-700 text-xs"
                  >
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Social media assets generator
export const SocialMediaAssets: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generatedAssets, setGeneratedAssets] = useState<{[key: string]: string}>({});

  const socialMediaSizes = {
    'Twitter Header': { width: 1500, height: 500 },
    'Facebook Cover': { width: 1200, height: 630 },
    'LinkedIn Banner': { width: 1584, height: 396 },
    'Instagram Post': { width: 1080, height: 1080 },
    'YouTube Thumbnail': { width: 1280, height: 720 },
    'Open Graph': { width: 1200, height: 630 }
  };

  const generateSocialAsset = (name: string, dimensions: { width: number; height: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, brandColors.primary.light);
    gradient.addColorStop(0.5, brandColors.secondary.light);
    gradient.addColorStop(1, brandColors.primary.dark);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add overlay pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        ctx.fillRect(i, j, 20, 20);
      }
    }

    // Draw logo/text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.min(width, height) * 0.08}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Jonathan L Keck', width / 2, height / 2);

    // Draw subtitle
    ctx.font = `${Math.min(width, height) * 0.04}px Inter`;
    ctx.fillText('Full Stack Developer', width / 2, height / 2 + Math.min(width, height) * 0.1);

    return canvas.toDataURL('image/png');
  };

  const generateAllAssets = () => {
    const assets: {[key: string]: string} = {};
    
    Object.entries(socialMediaSizes).forEach(([name, dimensions]) => {
      assets[name] = generateSocialAsset(name, dimensions);
    });
    
    setGeneratedAssets(assets);
  };

  const downloadAsset = (dataUrl: string, name: string) => {
    const link = document.createElement('a');
    link.download = `${name.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="heading-3">Social Media Assets</h3>
        <button
          onClick={generateAllAssets}
          className="interactive-primary text-white px-4 py-2 rounded-lg"
        >
          Generate Assets
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {Object.keys(generatedAssets).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(generatedAssets).map(([name, asset]) => (
            <div key={name} className="space-y-3">
              <div className="border rounded-lg overflow-hidden bg-surface-secondary">
                <img
                  src={asset}
                  alt={name}
                  className="w-full h-auto"
                />
              </div>
              <div className="text-center">
                <p className="font-medium">{name}</p>
                <p className="text-sm text-tertiary">
                  {socialMediaSizes[name as keyof typeof socialMediaSizes].width} × {socialMediaSizes[name as keyof typeof socialMediaSizes].height}
                </p>
                <button
                  onClick={() => downloadAsset(asset, name)}
                  className="text-primary hover:text-primary-700 text-sm mt-1"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Logo; 