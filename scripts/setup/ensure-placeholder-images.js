#!/usr/bin/env node

/**
 * This script ensures that placeholder images exist in all required locations
 * It copies the placeholder image to various locations for fallbacks
 */

const fs = require('fs');
const path = require('path');

// Define source placeholder image and target locations
const SOURCE_PLACEHOLDER = path.join(__dirname, '../../public/images/projects/placeholder.jpg');
const TARGET_LOCATIONS = [
  path.join(__dirname, '../../public/images/placeholder-image.png'),
  path.join(__dirname, '../../public/images/placeholder.jpg'),
  path.join(__dirname, '../../public/images/projects/placeholder.jpg'),
  path.join(__dirname, '../../public/images/projects/ecommerce-platform.jpg'),
  path.join(__dirname, '../../public/images/projects/task-management.jpg'),
  path.join(__dirname, '../../public/images/projects/ai-image-generator.jpg'),
  // Add slideshow images
  path.join(__dirname, '../../public/images/slideshow/coding-1.jpg'),
  path.join(__dirname, '../../public/images/slideshow/coding-2.jpg'),
  path.join(__dirname, '../../public/images/slideshow/coding-3.jpg'),
  path.join(__dirname, '../../public/images/slideshow/coding-4.jpg'),
  path.join(__dirname, '../../public/images/slideshow/coding-5.jpg'),
];

// Ensure directories exist
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

// Main function
async function ensurePlaceholderImages() {
  console.log('Ensuring placeholder images exist in all required locations...');
  
  // Check if source placeholder exists
  if (!fs.existsSync(SOURCE_PLACEHOLDER)) {
    console.error('Source placeholder image not found:', SOURCE_PLACEHOLDER);
    console.log('Creating an empty placeholder...');
    
    // Create the directory if it doesn't exist
    ensureDirectoryExists(SOURCE_PLACEHOLDER);
    
    // Create a simple black image if source doesn't exist
    const emptyImageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABLSURBVHhe7cExAQAAAMKg9U9tDQ8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBt5zIAAdnCJ+IAAAAASUVORK5CYII=',
      'base64'
    );
    fs.writeFileSync(SOURCE_PLACEHOLDER, emptyImageData);
    console.log('Created empty placeholder at:', SOURCE_PLACEHOLDER);
  }
  
  // Copy to all target locations
  for (const targetPath of TARGET_LOCATIONS) {
    try {
      // Create directory if it doesn't exist
      ensureDirectoryExists(targetPath);
      
      // Copy the file
      fs.copyFileSync(SOURCE_PLACEHOLDER, targetPath);
      console.log('✅ Copied placeholder to:', targetPath);
    } catch (error) {
      console.error(`❌ Error copying to ${targetPath}:`, error.message);
    }
  }
  
  console.log('Placeholder images setup complete!');
}

// Run the script
ensurePlaceholderImages().catch(console.error); 