/**
 * Accessibility testing helper with axe-core
 * 
 * This module initializes axe-core for accessibility testing in development environments.
 * It should be imported only in development mode and not in production.
 */

export async function initializeAxe() {
  if (process.env.NODE_ENV !== 'production') {
    const ReactDOM = await import('react-dom');
    const axe = await import('@axe-core/react');
    
    // Initialize axe with sensible defaults
    axe.default(React, ReactDOM, 1000, {
      rules: [
        // Include specific rules or override defaults
      ]
    });
    
    console.log('Axe accessibility testing initialized. Check console for accessibility issues.');
  }
}
