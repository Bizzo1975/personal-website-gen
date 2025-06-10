#!/usr/bin/env node

/**
 * Accessibility audit script
 * 
 * This script checks the website for common accessibility issues
 * focusing on key WCAG requirements.
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3007';
const REPORTS_DIR = path.join(__dirname, '../accessibility-reports');

// Routes to test
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'blog', path: '/blog' },
  { name: 'projects', path: '/projects' },
  { name: 'contact', path: '/contact' }
];

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

async function runAccessibilityAudit() {
  console.log(chalk.blue('Starting accessibility audit...'));
  console.log(`Reports will be saved to: ${REPORTS_DIR}\n`);

  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Check if the server is running
    try {
      const page = await browser.newPage();
      const response = await page.goto(BASE_URL, { timeout: 10000 });
      
      if (!response || response.status() !== 200) {
        throw new Error('Server not running');
      }
      
      await page.close();
    } catch (error) {
      console.error(chalk.red('Error: Website is not running at ' + BASE_URL));
      console.log('Please start the website with: npm run dev');
      return;
    }
    
    const results = {
      timestamp: new Date().toISOString(),
      summary: {
        routesTested: ROUTES.length,
        totalIssues: 0,
        criticalIssues: 0, 
        seriousIssues: 0,
        moderate: 0,
        minor: 0
      },
      routeResults: []
    };

    // Test each route
    for (const route of ROUTES) {
      console.log(chalk.cyan(`Testing ${route.name} page (${route.path})...`));
      
      const page = await browser.newPage();
      
      // Inject axe-core
      await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle0' });
      await page.addScriptTag({ 
        path: require.resolve('axe-core/axe.min.js')
      });
      
      // Run axe analysis
      const axeResults = await page.evaluate(() => {
        return new Promise(resolve => {
          window.axe.run(document, { 
            restoreScroll: true 
          }, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });
      
      // Process results
      const routeResult = {
        name: route.name,
        path: route.path,
        violations: axeResults.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map(node => ({
            html: node.html,
            failureSummary: node.failureSummary
          }))
        })),
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        timestamp: new Date().toISOString()
      };
      
      // Update summary
      results.summary.totalIssues += routeResult.violations.length;
      routeResult.violations.forEach(v => {
        if (v.impact === 'critical') results.summary.criticalIssues++;
        if (v.impact === 'serious') results.summary.seriousIssues++;
        if (v.impact === 'moderate') results.summary.moderate++;
        if (v.impact === 'minor') results.summary.minor++;
      });
      
      results.routeResults.push(routeResult);
      
      // Print summary for this route
      console.log(`  ${chalk.green('✓')} Found ${routeResult.violations.length} issues`);
      
      if (routeResult.violations.length > 0) {
        for (const violation of routeResult.violations) {
          const impact = violation.impact;
          const color = impact === 'critical' ? chalk.red 
            : impact === 'serious' ? chalk.magenta
            : impact === 'moderate' ? chalk.yellow
            : chalk.gray;
          
          console.log(`    ${color('•')} ${color(impact.toUpperCase())}: ${violation.description}`);
          console.log(`      ${chalk.blue('Help URL:')} ${violation.helpUrl}`);
        }
      } else {
        console.log(`    ${chalk.green('✓')} No accessibility issues found on this page!`);
      }
      
      await page.close();
    }
    
    // Save full results
    const outputPath = path.join(REPORTS_DIR, `accessibility-${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    // Print summary
    console.log('\n' + chalk.blue('Accessibility Audit Summary:'));
    console.log(`${chalk.cyan('Total issues:')} ${results.summary.totalIssues}`);
    console.log(`${chalk.red('Critical issues:')} ${results.summary.criticalIssues}`);
    console.log(`${chalk.magenta('Serious issues:')} ${results.summary.seriousIssues}`);
    console.log(`${chalk.yellow('Moderate issues:')} ${results.summary.moderate}`);
    console.log(`${chalk.gray('Minor issues:')} ${results.summary.minor}`);
    console.log(`\n${chalk.green('Full report saved to:')} ${outputPath}`);
    
  } catch (error) {
    console.error(chalk.red('Error running accessibility audit:'), error);
  } finally {
    await browser.close();
  }
}

runAccessibilityAudit().catch(console.error);
