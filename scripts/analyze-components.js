#!/usr/bin/env node
/**
 * Component Analysis Script
 * 
 * This script analyzes React components to determine which ones could be 
 * converted from client to server components to improve performance.
 * 
 * Usage: node analyze-components.js
 */

const fs = require('fs');
const path = require('path');

// Simple console colors without external dependencies
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Color helper functions
const colorize = {
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  green: (text) => `${colors.green}${text}${colors.reset}`,
  red: (text) => `${colors.red}${text}${colors.reset}`,
  cyan: (text) => `${colors.cyan}${text}${colors.reset}`,
  magenta: (text) => `${colors.magenta}${text}${colors.reset}`
};

// Directories to scan
const DIRS_TO_SCAN = [
  path.join(process.cwd(), 'src/components'),
  path.join(process.cwd(), 'src/app')
];

// Client-side hooks and APIs to look for
const CLIENT_SIDE_PATTERNS = [
  'useState', 
  'useEffect', 
  'useRef',
  'useCallback',
  'useMemo',
  'useContext',
  'useReducer',
  'useLayoutEffect',
  'useId',
  'useTransition',
  'useDeferredValue',
  'useImperativeHandle',
  'useInsertionEffect',
  'use client',
  'onClick',
  'onChange',
  'onSubmit',
  'onBlur',
  'onFocus',
  'addEventListener',
  'removeEventListener',
  'location.href',
  'window.',
  'document.'
];

// Patterns that might indicate a component could be a server component
const SERVER_COMPONENT_INDICATORS = [
  'getStaticProps',
  'getServerSideProps', 
  'async function',
  'fetch(',
  'db.',
  'database',
  'mongo',
  'prisma',
  'sql',
  'model',
  'service'
];

// File extensions to analyze
const FILE_EXTENSIONS = ['.tsx', '.jsx', '.js', '.ts'];

// Results storage
const results = {
  potentialServerComponents: [],
  clientComponents: [],
  alreadyServerComponents: []
};

/**
 * Check if a file seems to be using client-side features
 */
function hasClientSideFeatures(content) {
  return CLIENT_SIDE_PATTERNS.some(pattern => content.includes(pattern));
}

/**
 * Check if a file seems to be a good candidate for server component
 */
function hasServerComponentIndicators(content) {
  return SERVER_COMPONENT_INDICATORS.some(pattern => content.includes(pattern));
}

/**
 * Check if a file is already marked as a server component
 */
function isAlreadyServerComponent(content) {
  // Server components in Next.js are the default, so we need to look for the absence of 'use client'
  return !content.includes('use client') && !content.includes("'use client'") && !content.includes('"use client"');
}

/**
 * Process a single file to determine if it could be a server component
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Skip non-component files
    if (!content.includes('export default') && !content.includes('function') && !content.includes('const')) {
      return;
    }
    
    // Check what type of component it is
    if (isAlreadyServerComponent(content)) {
      if (hasClientSideFeatures(content)) {
        // This might be problematic - it's a server component with client features
        console.warn(colorize.yellow(`Warning: ${relativePath} appears to be a server component with client-side features!`));
      } else {
        results.alreadyServerComponents.push(relativePath);
      }
    } else if (hasClientSideFeatures(content)) {
      // It's a client component
      results.clientComponents.push(relativePath);
    } else if (hasServerComponentIndicators(content)) {
      // It seems like it could be a server component
      results.potentialServerComponents.push(relativePath);
    } else {
      // It's a client component without clear indicators
      results.clientComponents.push(relativePath);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

/**
 * Recursively scan a directory for component files
 */
function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        scanDirectory(entryPath);
      }
    } else if (FILE_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      processFile(entryPath);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log(colorize.blue('Analyzing components for server component conversion opportunities...'));
  
  // Scan all directories
  for (const dir of DIRS_TO_SCAN) {
    if (fs.existsSync(dir)) {
      scanDirectory(dir);
    } else {
      console.warn(chalk.yellow(`Warning: Directory ${dir} does not exist`));
    }
  }
  
  // Print results
  console.log('\n' + colorize.green('=== Component Analysis Results ==='));
  
  console.log(colorize.green(`\n✓ Already Server Components (${results.alreadyServerComponents.length}):`))
  results.alreadyServerComponents.forEach(path => console.log(`  ${path}`));
  
  console.log(colorize.yellow(`\n⚠ Client Components (${results.clientComponents.length}):`))
  results.clientComponents.forEach(path => console.log(`  ${path}`));
  
  console.log(colorize.blue(`\n→ Potential Server Component Conversions (${results.potentialServerComponents.length}):`))
  results.potentialServerComponents.forEach(path => console.log(`  ${path}`));
  
  // Print summary
  console.log('\n' + colorize.cyan('=== Summary ==='));
  console.log(`Total components analyzed: ${
    results.potentialServerComponents.length + 
    results.clientComponents.length + 
    results.alreadyServerComponents.length
  }`);
  
  // Provide recommendation
  if (results.potentialServerComponents.length > 0) {
    console.log('\n' + colorize.magenta('Recommendation:'));
    console.log('Consider converting these components to server components by removing the "use client" directive:');
    results.potentialServerComponents.forEach(path => {
      console.log(colorize.cyan(`- ${path}`));
    });
  } else {
    console.log('\n' + colorize.magenta('No immediate conversion opportunities found.'));
  }
}

// Run the script
main();
