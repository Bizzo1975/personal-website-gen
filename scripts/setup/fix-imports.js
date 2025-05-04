// fix-imports.js
// This script will update import paths in the admin pages to use path aliases

const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'src/app/admin/pages/page.tsx',
  'src/app/admin/pages/[id]/page.tsx',
  'src/app/admin/pages/new/page.tsx'
];

// Function to replace relative imports with absolute imports
function updateImports(fileContent) {
  // Replace relative imports with path aliases
  fileContent = fileContent.replace(/from ['"]\.\.\/\.\.\/\.\.\/components\/(.*)['"]/g, "from '@/components/$1'");
  fileContent = fileContent.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/components\/(.*)['"]/g, "from '@/components/$1'");
  
  // Replace any direct imports of services
  fileContent = fileContent.replace(/from ['"]\.\.\/\.\.\/\.\.\/lib\/services\/(.*)['"]/g, "from '@/lib/services/$1'");
  fileContent = fileContent.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/lib\/services\/(.*)['"]/g, "from '@/lib/services/$1'");
  
  return fileContent;
}

// Main function
async function main() {
  console.log('Fixing import paths...');
  
  for (const filePath of filesToFix) {
    const fullPath = path.resolve(process.cwd(), filePath);
    
    try {
      if (fs.existsSync(fullPath)) {
        console.log(`Processing ${filePath}...`);
        
        // Read file content
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Update imports
        const updatedContent = updateImports(content);
        
        // Write back if changed
        if (content !== updatedContent) {
          fs.writeFileSync(fullPath, updatedContent);
          console.log(`✅ Updated ${filePath}`);
        } else {
          console.log(`⏭️ No changes needed for ${filePath}`);
        }
      } else {
        console.log(`⚠️ File not found: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
    }
  }
  
  console.log('Import paths fixed!');
}

main().catch(console.error); 