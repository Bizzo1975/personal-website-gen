/**
 * HTML Sanitization Utility
 * 
 * This module provides utilities for sanitizing user-generated HTML content
 * to prevent XSS attacks and ensure content security.
 */

// Dynamic import for SSR compatibility
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// Create a DOM window for server-side sanitization
const createDOMPurify = () => {
  const window = new JSDOM('').window;
  return DOMPurify(window);
};

/**
 * Configuration for different sanitization levels
 */
export type SanitizeConfig = {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ALLOW_DATA_ATTR?: boolean;
  ALLOW_UNKNOWN_PROTOCOLS?: boolean;
  ADD_TAGS?: string[];
  ADD_ATTR?: string[];
};

// Common sanitization configurations
const sanitizeConfigs = {
  // Strict configuration for minimal formatting (comments, basic user content)
  strict: {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false
  },
  
  // Standard configuration for blog posts, articles (includes images)
  standard: {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'blockquote',
      'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'src', 'alt', 'width', 
      'height', 'title', 'style'
    ],
    ALLOW_DATA_ATTR: false
  },
  
  // Extended for admin/trusted content (allows embeds, includes more attributes)
  extended: {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'blockquote',
      'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'iframe',
      'figure', 'figcaption', 'audio', 'video', 'source', 'svg', 'path',
      'section', 'article', 'header', 'footer', 'aside', 'nav', 'main'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'src', 'alt', 'width', 
      'height', 'title', 'style', 'controls', 'autoplay', 'muted', 'loop',
      'poster', 'preload', 'playsinline', 'allowfullscreen', 'frameborder',
      'aria-label', 'aria-hidden', 'tabindex', 'role'
    ],
    ALLOW_DATA_ATTR: true,
    ALLOW_UNKNOWN_PROTOCOLS: false
  }
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * @param html The HTML content to sanitize
 * @param configType The sanitization level: 'strict', 'standard', or 'extended'
 * @param customConfig Optional custom configuration that overrides the selected config
 * @returns The sanitized HTML
 */
export function sanitizeHtml(
  html: string,
  configType: 'strict' | 'standard' | 'extended' = 'standard',
  customConfig?: SanitizeConfig
): string {
  if (!html) return '';
  
  // Get the predefined config
  const baseConfig = sanitizeConfigs[configType];
  
  // Merge with custom config if provided
  const config = customConfig ? { ...baseConfig, ...customConfig } : baseConfig;
  
  // Create DOMPurify instance
  const purify = createDOMPurify();
  
  // Add hook to enforce noopener and noreferrer on external links
  purify.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName === 'A' && node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      if (href && (href.startsWith('http') || href.startsWith('//'))) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
    
    // Add title attributes for accessibility where appropriate
    if (node.nodeName === 'IMG' && node.hasAttribute('alt')) {
      if (!node.hasAttribute('title')) {
        node.setAttribute('title', node.getAttribute('alt') || '');
      }
    }
  });
  
  // Sanitize and return the HTML
  return purify.sanitize(html, config);
}

/**
 * Strip all HTML tags to get plain text
 * 
 * @param html The HTML content to strip
 * @returns Plain text with all HTML removed
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  const purify = createDOMPurify();
  return purify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Create an excerpt from HTML content
 * 
 * @param html The HTML content to create an excerpt from
 * @param maxLength Maximum length of the excerpt in characters
 * @returns Plain text excerpt with ellipsis if truncated
 */
export function createExcerpt(html: string, maxLength: number = 160): string {
  const plainText = stripHtml(html)
    .replace(/\s+/g, ' ')
    .trim();
    
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength).trim() + '...';
}
