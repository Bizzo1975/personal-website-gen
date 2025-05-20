/**
 * Accessibility utility functions
 * 
 * This module provides helpers for ensuring accessibility standards are met
 */

/**
 * Checks if a contrast ratio meets WCAG guidelines
 * @param ratio The contrast ratio to check
 * @param level The WCAG level to check against ('AA' or 'AAA')
 * @param isLargeText Whether the text is considered "large" (18pt+ or 14pt+ bold)
 * @returns Whether the contrast ratio meets the guidelines
 */
export const meetsContrastGuidelines = (
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): boolean => {
  if (level === 'AA') {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }
  
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  
  return false;
};

/**
 * Calculates the relative luminance of an RGB color
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns The relative luminance value
 */
export const calculateLuminance = (r: number, g: number, b: number): number => {
  // Convert RGB to sRGB
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;
  
  // Calculate RGB values
  const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

/**
 * Calculates contrast ratio between two colors
 * @param foreground Foreground color in hex format (e.g., "#FFFFFF")
 * @param background Background color in hex format (e.g., "#000000")
 * @returns The contrast ratio
 */
export const calculateContrastRatio = (foreground: string, background: string): number => {
  // Parse hex colors to RGB
  const fgRGB = hexToRgb(foreground);
  const bgRGB = hexToRgb(background);
  
  if (!fgRGB || !bgRGB) {
    throw new Error('Invalid color format. Use hex format (e.g., "#FFFFFF")');
  }
  
  // Calculate luminance
  const fgLuminance = calculateLuminance(fgRGB.r, fgRGB.g, fgRGB.b);
  const bgLuminance = calculateLuminance(bgRGB.r, bgRGB.g, bgRGB.b);
  
  // Calculate contrast ratio
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Converts a hex color to RGB
 * @param hex Hex color (e.g., "#FFFFFF" or "#FFF")
 * @returns RGB object or null if invalid
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Handle shorthand hex (e.g., #FFF)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Convert to RGB
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
};

/**
 * Checks if text meets WCAG contrast guidelines
 * @param textColor Text color in hex format
 * @param bgColor Background color in hex format
 * @param level WCAG level to check against ('AA' or 'AAA')
 * @param isLargeText Whether the text is large (18pt+ or 14pt+ bold)
 * @returns Whether the text meets the guidelines
 */
export const textMeetsContrastGuidelines = (
  textColor: string,
  bgColor: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): boolean => {
  const ratio = calculateContrastRatio(textColor, bgColor);
  return meetsContrastGuidelines(ratio, level, isLargeText);
};
