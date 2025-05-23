// check-fixes.js
// Test script to verify that the fixes were applied correctly

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of files to check
const filesToCheck = [
  'src/app/layout.tsx',
  'src/app/providers.tsx',
  'src/components/ThemeProvider.tsx',
  'src/styles/globals.css',
  'src/app/about/page.tsx',
  'src/app/about/about-page.tsx',
  'src/app/blog/page.tsx',
  'src/app/blog/blog-page.tsx',
  'src/app/projects/page.tsx',
  'src/app/projects/projects-page.tsx',
];

// Functions to check specific details in files
function checkThemeImport(content) {
  return content.includes('next-themes') || content.includes('ThemeProvider');
}

function checkHoverCardStyle(content) {
  return content.includes('hover-card');
}

function checkComponentExists(content, componentName) {
  return content.includes(`export default ${componentName}`) || content.includes(`function ${componentName}`);
}

function checkCssClasses(content) {
  return content.includes('shadow-tech') || content.includes('@layer utilities');
}

// Main check function
function runChecks() {
  console.log('🔍 Running checks on fixed files...\n');
  let allPassed = true;
  let checksPassed = 0;
  let totalChecks = filesToCheck.length;
  
  // Verify each file exists and has expected content
  filesToCheck.forEach(relativePath => {
    const filePath = path.resolve(process.cwd(), relativePath);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${relativePath} - File not found`);
      allPassed = false;
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    let checkResult = true;
    let details = [];
    
    // Apply specific checks based on file type
    if (relativePath.includes('Theme') || relativePath.includes('providers')) {
      if (!checkThemeImport(content)) {
        checkResult = false;
        details.push('Missing theme provider import');
      }
    }
    
    if (relativePath.includes('globals.css')) {
      if (!checkCssClasses(content)) {
        checkResult = false;
        details.push('Missing required CSS classes');
      }
    }
    
    if (relativePath.includes('page.tsx')) {
      if (!content.includes('export default') && !content.includes('function Page')) {
        checkResult = false;
        details.push('Missing page component export');
      }
    }
    
    if (relativePath.includes('-page.tsx')) {
      const componentName = path.basename(relativePath, '.tsx')
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
        
      if (!checkComponentExists(content, componentName)) {
        checkResult = false;
        details.push(`Missing ${componentName} component`);
      }
    }
    
    // Output check result
    if (checkResult) {
      console.log(`✅ ${relativePath} - Passes all checks`);
      checksPassed++;
    } else {
      console.log(`❌ ${relativePath} - Failed checks: ${details.join(', ')}`);
      allPassed = false;
    }
  });
  
  // Final summary
  console.log(`\n===== CHECK SUMMARY =====`);
  console.log(`✅ ${checksPassed}/${totalChecks} files pass all checks`);
  
  if (allPassed) {
    console.log(`\n🎉 All fixes appear to have been applied correctly!`);
    console.log(`Your website should now have the following fixed:`);
    console.log(`1. Theme switching working properly`);
    console.log(`2. Layout issues fixed with improved CSS styling`);
    console.log(`3. About page loading correctly`);
    console.log(`4. Blog and projects pages with proper formatting`);
    console.log(`\nCheck the live site to confirm visually.`);
  } else {
    console.log(`\n⚠️ Some checks failed. There might still be issues to fix.`);
  }
}

// Run all checks
runChecks(); 