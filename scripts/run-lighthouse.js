#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 * 
 * This script runs Lighthouse audits on the personal website pages
 * and outputs the results to the console and JSON files.
 * 
 * Usage: 
 *   npm run lighthouse
 *   
 * Requirements:
 *   - Lighthouse: npm install -g lighthouse
 *   - Node.js 14+
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);
const BASE_URL = 'http://localhost:3000';
const REPORTS_DIR = path.join(__dirname, '../lighthouse-reports');

// Pages to test
const PAGES = [
  { name: 'home', path: '' },
  { name: 'about', path: 'about' },
  { name: 'blog', path: 'blog' },
  { name: 'projects', path: 'projects' },
  { name: 'contact', path: 'contact' }
];

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Color formatting for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Format score with color
function formatScore(score) {
  const numScore = parseFloat(score);
  
  if (numScore >= 0.9) {
    return `${colors.green}${Math.round(numScore * 100)}${colors.reset}`;
  } else if (numScore >= 0.5) {
    return `${colors.yellow}${Math.round(numScore * 100)}${colors.reset}`;
  } else {
    return `${colors.red}${Math.round(numScore * 100)}${colors.reset}`;
  }
}

// Run lighthouse for a specific page
async function runLighthouse(page) {
  const url = `${BASE_URL}/${page.path}`;
  const outputPath = path.join(REPORTS_DIR, `${page.name}.json`);
  
  console.log(`\n${colors.blue}Running Lighthouse audit for ${colors.cyan}${page.name}${colors.reset} page`);
  console.log(`URL: ${url}`);
  
  try {
    // Run lighthouse with specific config
    const command = `lighthouse ${url} --output=json --output-path=${outputPath} --quiet --chrome-flags="--headless --no-sandbox --disable-gpu" --only-categories=performance,accessibility,best-practices,seo`;
    
    await execPromise(command);
    
    // Read and parse the results
    const rawData = fs.readFileSync(outputPath, 'utf8');
    const results = JSON.parse(rawData);
    
    // Extract and display core metrics
    const { categories, audits } = results;
    
    console.log(`\n${colors.magenta}Results for ${page.name}${colors.reset}:`);
    console.log(`- Performance:   ${formatScore(categories.performance.score)}`);
    console.log(`- Accessibility: ${formatScore(categories.accessibility.score)}`);
    console.log(`- Best Practices: ${formatScore(categories['best-practices'].score)}`);
    console.log(`- SEO:          ${formatScore(categories.seo.score)}`);
    
    // Core Web Vitals
    console.log(`\n${colors.cyan}Core Web Vitals:${colors.reset}`);
    console.log(`- LCP: ${audits['largest-contentful-paint'].displayValue}`);
    console.log(`- CLS: ${audits['cumulative-layout-shift'].displayValue}`);
    console.log(`- FID/TBT: ${audits['total-blocking-time'].displayValue}`);
    
    return {
      name: page.name,
      performance: categories.performance.score,
      accessibility: categories.accessibility.score,
      bestPractices: categories['best-practices'].score,
      seo: categories.seo.score,
      lcp: audits['largest-contentful-paint'].numericValue,
      cls: audits['cumulative-layout-shift'].numericValue,
      tbt: audits['total-blocking-time'].numericValue
    };
  } catch (error) {
    console.error(`${colors.red}Error running Lighthouse for ${page.name}:${colors.reset}`, error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log(`${colors.blue}Starting Lighthouse performance audits...${colors.reset}`);
  console.log(`Reports will be saved to: ${REPORTS_DIR}`);
  
  const results = [];
  
  // Check if the site is running
  try {
    await execPromise(`curl -s ${BASE_URL} > /dev/null`);
  } catch (error) {
    console.error(`${colors.red}Error: Website is not running at ${BASE_URL}${colors.reset}`);
    console.log('Please start the website with: npm run dev');
    process.exit(1);
  }
  
  // Run lighthouse for each page
  for (const page of PAGES) {
    const result = await runLighthouse(page);
    if (result) {
      results.push(result);
    }
  }
  
  // Save summary
  const summaryPath = path.join(REPORTS_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  
  console.log(`\n${colors.green}All audits completed!${colors.reset}`);
  console.log(`Summary saved to: ${summaryPath}`);
}

main().catch(error => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});
