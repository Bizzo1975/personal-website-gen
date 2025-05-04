// fix-css-imports.js
// This script ensures that CSS imports are correctly handled after path fixes

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to check
const directoriesToCheck = [
  'src/app/admin/pages',
  'src/app/admin/dashboard',
  'src/app/admin/login',
  'src/app/admin/signup',
  'src/app/admin/posts',
  'src/app/admin/projects',
  'src/app/admin/settings'
];

// Function to find all TypeScript and TSX files in directories
function findTsxFiles(directories) {
  const fileList = [];
  
  directories.forEach(dir => {
    try {
      const fullPath = path.resolve(process.cwd(), dir);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`Directory not found: ${dir}`);
        return;
      }
      
      const walk = (currentPath) => {
        const items = fs.readdirSync(currentPath);
        
        items.forEach(item => {
          const itemPath = path.join(currentPath, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            walk(itemPath);
          } else if (stat.isFile() && itemPath.endsWith('.tsx')) {
            fileList.push(itemPath);
          }
        });
      };
      
      walk(fullPath);
    } catch (error) {
      console.error(`Error processing ${dir}:`, error);
    }
  });
  
  return fileList;
}

// Function to ensure CSS is imported correctly in a file
function fixCssImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file uses Card, Badge, Button, or other components
    const usesComponents = /import .* from ['"]@\/components\/(Card|Badge|Button|Layout)/i.test(content);
    
    // Add global CSS import if it's missing and using components
    if (usesComponents && !content.includes("import '@/styles/globals.css'")) {
      const insertPoint = content.indexOf("'use client'") !== -1 
        ? content.indexOf("'use client'") + 12 
        : 0;
      
      content = content.slice(0, insertPoint) + "\nimport '@/styles/globals.css';\n" + content.slice(insertPoint);
      modified = true;
      console.log(`Added missing globals.css import to ${filePath}`);
    }
    
    // If file uses React but doesn't have 'use client' directive, add it
    if (content.includes('import React') && !content.includes("'use client'")) {
      content = "'use client';\n\n" + content;
      modified = true;
      console.log(`Added missing 'use client' directive to ${filePath}`);
    }
    
    // Write back file if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  console.log('Fixing CSS imports in admin pages...');
  
  // Find all TSX files in target directories
  const tsxFiles = findTsxFiles(directoriesToCheck);
  console.log(`Found ${tsxFiles.length} TSX files to check.`);
  
  // Fix CSS imports in each file
  let modifiedCount = 0;
  
  tsxFiles.forEach(filePath => {
    if (fixCssImports(filePath)) {
      modifiedCount++;
    }
  });
  
  console.log(`\nFixed CSS imports in ${modifiedCount} files.`);
  
  if (modifiedCount > 0) {
    console.log('\nNote: You may need to restart your Next.js development server for changes to take effect.');
    
    // Check if development server is running
    try {
      const isServerRunning = execSync('ps aux | grep "next dev" | grep -v grep', { stdio: 'pipe' }).toString().trim().length > 0;
      
      if (isServerRunning) {
        console.log('\n⚠️ It appears that the Next.js development server is running.');
        console.log('For changes to take effect, restart the server with:');
        console.log('1. Stop the current server (Ctrl+C)');
        console.log('2. Run "npm run dev" again');
      }
    } catch (error) {
      // Server not running, no action needed
    }
  }
  
  // Add custom fix for Card and Badge components to ensure styles are loaded
  const componentsDir = path.resolve(process.cwd(), 'src/components');
  const cardPath = path.join(componentsDir, 'Card.tsx');
  const badgePath = path.join(componentsDir, 'Badge.tsx');
  
  if (fs.existsSync(cardPath)) {
    let cardContent = fs.readFileSync(cardPath, 'utf8');
    
    if (!cardContent.includes('shadow-tech')) {
      console.log('\nUpdating Card component to ensure proper styling...');
      
      // Replace potential missing Tailwind classes
      cardContent = cardContent.replace(/const baseClasses = ['"]([^'"]+)['"];/, 
        "const baseClasses = 'bg-white dark:bg-slate-900 rounded-lg overflow-hidden';");
        
      cardContent = cardContent.replace(/const variantClasses = {([^}]+)}/s, 
        `const variantClasses = {
    default: 'shadow-tech',
    elevated: 'shadow-tech-lg',
    bordered: 'border border-slate-200 dark:border-slate-800',
  }`);
      
      fs.writeFileSync(cardPath, cardContent);
      console.log('✅ Updated Card component');
    }
  }
  
  if (fs.existsSync(badgePath)) {
    let badgeContent = fs.readFileSync(badgePath, 'utf8');
    
    if (!badgeContent.includes('bg-primary-100')) {
      console.log('\nUpdating Badge component to ensure proper styling...');
      
      // Replace potential missing Tailwind classes
      badgeContent = badgeContent.replace(/const variantClasses = {([^}]+)}/s, 
        `const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  }`);
      
      fs.writeFileSync(badgePath, badgeContent);
      console.log('✅ Updated Badge component');
    }
  }
  
  console.log('\nDone!');
}

main().catch(console.error); 