// Favicon and Social Media Asset Generator Utility

export interface FaviconSize {
  size: number;
  name: string;
  type: 'ico' | 'png' | 'svg';
}

export interface SocialMediaAsset {
  name: string;
  width: number;
  height: number;
  description: string;
}

// Standard favicon sizes
export const faviconSizes: FaviconSize[] = [
  { size: 16, name: 'favicon-16x16', type: 'png' },
  { size: 32, name: 'favicon-32x32', type: 'png' },
  { size: 48, name: 'favicon-48x48', type: 'png' },
  { size: 64, name: 'favicon-64x64', type: 'png' },
  { size: 96, name: 'favicon-96x96', type: 'png' },
  { size: 128, name: 'favicon-128x128', type: 'png' },
  { size: 192, name: 'android-chrome-192x192', type: 'png' },
  { size: 256, name: 'favicon-256x256', type: 'png' },
  { size: 512, name: 'android-chrome-512x512', type: 'png' },
];

// Social media asset dimensions
export const socialMediaAssets: SocialMediaAsset[] = [
  { name: 'Twitter Header', width: 1500, height: 500, description: 'Twitter profile header image' },
  { name: 'Facebook Cover', width: 1200, height: 630, description: 'Facebook page cover photo' },
  { name: 'LinkedIn Banner', width: 1584, height: 396, description: 'LinkedIn profile banner' },
  { name: 'Instagram Post', width: 1080, height: 1080, description: 'Instagram square post' },
  { name: 'Instagram Story', width: 1080, height: 1920, description: 'Instagram story template' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, description: 'YouTube video thumbnail' },
  { name: 'Open Graph', width: 1200, height: 630, description: 'Open Graph meta image' },
  { name: 'Twitter Card', width: 1200, height: 600, description: 'Twitter card image' },
];

// Brand colors
export const brandColors = {
  primary: {
    light: '#10b981', // Emerald-500
    dark: '#0ea5e9',  // Sky-500
  },
  secondary: {
    light: '#0ea5e9', // Sky-500
    dark: '#1e3a8a',  // Blue-800
  },
  neutral: {
    white: '#ffffff',
    black: '#000000',
    gray: {
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
    }
  }
};

// Generate favicon canvas
export const generateFaviconCanvas = (size: number, theme: 'light' | 'dark' = 'light'): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = size;
  canvas.height = size;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Choose colors based on theme
  const colors = theme === 'light' 
    ? { primary: brandColors.primary.light, secondary: brandColors.secondary.light }
    : { primary: brandColors.primary.dark, secondary: brandColors.secondary.dark };

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.secondary);
  
  // Draw background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add subtle pattern for larger sizes
  if (size >= 64) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    const patternSize = Math.max(4, size / 16);
    for (let i = 0; i < size; i += patternSize * 2) {
      for (let j = 0; j < size; j += patternSize * 2) {
        ctx.fillRect(i, j, patternSize, patternSize);
      }
    }
  }

  // Draw initials
  ctx.fillStyle = brandColors.neutral.white;
  ctx.font = `bold ${size * 0.4}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JLK', size / 2, size / 2);

  // Add border for smaller sizes
  if (size <= 32) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);
  }

  return canvas;
};

// Generate social media asset canvas
export const generateSocialAssetCanvas = (
  asset: SocialMediaAsset, 
  theme: 'light' | 'dark' = 'light',
  customText?: { title?: string; subtitle?: string }
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const { width, height } = asset;
  canvas.width = width;
  canvas.height = height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Choose colors based on theme
  const colors = theme === 'light' 
    ? { 
        primary: brandColors.primary.light, 
        secondary: brandColors.secondary.light,
        text: brandColors.neutral.white,
        accent: brandColors.neutral.gray[100]
      }
    : { 
        primary: brandColors.primary.dark, 
        secondary: brandColors.secondary.dark,
        text: brandColors.neutral.white,
        accent: brandColors.neutral.gray[200]
      };

  // Create gradient background
  const gradient = ctx.createRadialGradient(
    width * 0.3, height * 0.3, 0,
    width * 0.7, height * 0.7, Math.max(width, height)
  );
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(0.6, colors.secondary);
  gradient.addColorStop(1, theme === 'light' ? brandColors.neutral.gray[800] : brandColors.neutral.gray[900]);
  
  // Draw background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add geometric pattern overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  const patternSize = Math.min(width, height) / 20;
  for (let i = 0; i < width; i += patternSize * 2) {
    for (let j = 0; j < height; j += patternSize * 2) {
      ctx.fillRect(i, j, patternSize, patternSize);
    }
  }

  // Draw main title
  const title = customText?.title || 'Jonathan L Keck';
  ctx.fillStyle = colors.text;
  ctx.font = `bold ${Math.min(width, height) * 0.08}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Add text shadow for better readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  ctx.fillText(title, width / 2, height / 2 - Math.min(width, height) * 0.05);

  // Draw subtitle
  const subtitle = customText?.subtitle || 'Full Stack Developer';
  ctx.font = `${Math.min(width, height) * 0.04}px Inter, sans-serif`;
  ctx.fillStyle = colors.accent;
  ctx.fillText(subtitle, width / 2, height / 2 + Math.min(width, height) * 0.08);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Add logo/icon in corner for larger assets
  if (width >= 1000) {
    const logoSize = Math.min(width, height) * 0.1;
    const logoX = width - logoSize - 40;
    const logoY = height - logoSize - 40;
    
    // Draw logo background
    ctx.fillStyle = colors.primary;
    ctx.fillRect(logoX, logoY, logoSize, logoSize);
    
    // Draw logo text
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${logoSize * 0.3}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('JLK', logoX + logoSize / 2, logoY + logoSize / 2);
  }

  return canvas;
};

// Convert canvas to data URL
export const canvasToDataURL = (canvas: HTMLCanvasElement, format: 'png' | 'jpeg' = 'png', quality = 0.9): string => {
  return canvas.toDataURL(`image/${format}`, quality);
};

// Download canvas as file
export const downloadCanvas = (canvas: HTMLCanvasElement, filename: string, format: 'png' | 'jpeg' = 'png'): void => {
  const dataURL = canvasToDataURL(canvas, format);
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate all favicons
export const generateAllFavicons = (theme: 'light' | 'dark' = 'light'): { [key: string]: string } => {
  const favicons: { [key: string]: string } = {};
  
  faviconSizes.forEach(({ size, name }) => {
    const canvas = generateFaviconCanvas(size, theme);
    favicons[name] = canvasToDataURL(canvas);
  });
  
  return favicons;
};

// Generate all social media assets
export const generateAllSocialAssets = (
  theme: 'light' | 'dark' = 'light',
  customText?: { title?: string; subtitle?: string }
): { [key: string]: string } => {
  const assets: { [key: string]: string } = {};
  
  socialMediaAssets.forEach((asset) => {
    const canvas = generateSocialAssetCanvas(asset, theme, customText);
    assets[asset.name] = canvasToDataURL(canvas);
  });
  
  return assets;
};

// Generate web app manifest
export const generateWebAppManifest = (
  name: string = 'Jonathan L Keck',
  shortName: string = 'JLK',
  description: string = 'Full Stack Developer Portfolio',
  themeColor: string = brandColors.primary.light,
  backgroundColor: string = brandColors.neutral.white
) => {
  return {
    name,
    short_name: shortName,
    description,
    start_url: '/',
    display: 'standalone',
    theme_color: themeColor,
    background_color: backgroundColor,
    icons: faviconSizes.map(({ size, name }) => ({
      src: `/icons/${name}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: size >= 192 ? 'any maskable' : 'any'
    }))
  };
};

// Generate HTML meta tags for favicons
export const generateFaviconMetaTags = (): string => {
  const tags = [
    '<link rel="icon" type="image/x-icon" href="/favicon.ico">',
    '<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48x48.png">',
    '<link rel="icon" type="image/png" sizes="64x64" href="/icons/favicon-64x64.png">',
    '<link rel="icon" type="image/png" sizes="96x96" href="/icons/favicon-96x96.png">',
    '<link rel="icon" type="image/png" sizes="128x128" href="/icons/favicon-128x128.png">',
    '<link rel="icon" type="image/png" sizes="192x192" href="/icons/android-chrome-192x192.png">',
    '<link rel="icon" type="image/png" sizes="256x256" href="/icons/favicon-256x256.png">',
    '<link rel="icon" type="image/png" sizes="512x512" href="/icons/android-chrome-512x512.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">',
    '<link rel="manifest" href="/manifest.json">',
    `<meta name="theme-color" content="${brandColors.primary.light}">`,
    `<meta name="msapplication-TileColor" content="${brandColors.primary.light}">`,
    '<meta name="msapplication-config" content="/browserconfig.xml">'
  ];
  
  return tags.join('\n');
};

export default {
  generateFaviconCanvas,
  generateSocialAssetCanvas,
  generateAllFavicons,
  generateAllSocialAssets,
  generateWebAppManifest,
  generateFaviconMetaTags,
  downloadCanvas,
  faviconSizes,
  socialMediaAssets,
  brandColors
}; 