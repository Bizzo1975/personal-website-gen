import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with clsx and tailwind-merge
 * 
 * This utility function combines multiple class names and
 * merges Tailwind CSS classes properly to handle conflicts
 * 
 * @param inputs - Array of class names, objects, or conditional expressions
 * @returns - Merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 