import { calculateContrastRatio, meetsContrastGuidelines } from './a11y-utils';

/**
 * Interface for theme colors with contrast analysis
 */
export interface ThemeColorWithContrast {
  name: string;
  value: string;
  contrastWithDark: number;
  contrastWithLight: number;
  isAccessibleOnDark: boolean;
  isAccessibleOnLight: boolean;
}

// Common background colors
const LIGHT_BG = '#ffffff';
const DARK_BG = '#121212';

/**
 * Analyzes a color for accessibility on light and dark backgrounds
 * @param name Color name
 * @param value Color value in hex format
 * @returns Color with contrast analysis
 */
export const analyzeColorContrast = (name: string, value: string): ThemeColorWithContrast => {
  const contrastWithLight = calculateContrastRatio(value, LIGHT_BG);
  const contrastWithDark = calculateContrastRatio(value, DARK_BG);
  
  return {
    name,
    value,
    contrastWithDark,
    contrastWithLight,
    isAccessibleOnDark: meetsContrastGuidelines(contrastWithDark, 'AA'),
    isAccessibleOnLight: meetsContrastGuidelines(contrastWithLight, 'AA')
  };
};

/**
 * Generates a report on theme colors for accessibility
 * @param colors Object with color names and values
 * @returns Array of colors with contrast analysis
 */
export const analyzeThemeColors = (colors: Record<string, string>): ThemeColorWithContrast[] => {
  return Object.entries(colors).map(([name, value]) => 
    analyzeColorContrast(name, value)
  );
};

/**
 * Generates a text color that ensures sufficient contrast with background
 * @param bgColor Background color in hex format
 * @param preferredTextColor Preferred text color in hex format
 * @param fallbackLight Light fallback color for dark backgrounds
 * @param fallbackDark Dark fallback color for light backgrounds
 * @returns A text color with sufficient contrast
 */
export const getAccessibleTextColor = (
  bgColor: string,
  preferredTextColor: string,
  fallbackLight = '#ffffff',
  fallbackDark = '#000000'
): string => {
  const preferredContrast = calculateContrastRatio(preferredTextColor, bgColor);
  
  // If preferred color has sufficient contrast, use it
  if (meetsContrastGuidelines(preferredContrast, 'AA')) {
    return preferredTextColor;
  }
  
  // Determine if background is light or dark
  const contrastWithWhite = calculateContrastRatio('#ffffff', bgColor);
  const contrastWithBlack = calculateContrastRatio('#000000', bgColor);
  
  // Return appropriate fallback color
  return contrastWithWhite > contrastWithBlack ? fallbackLight : fallbackDark;
};
