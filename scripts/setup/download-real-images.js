#!/usr/bin/env node

/**
 * This script downloads real images for the project from Unsplash
 * and updates the placeholder images with these real images.
 * 
 * The script uses Node.js's built-in https module to download images
 * without requiring additional dependencies.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Define the image URLs and target locations
const IMAGES_TO_DOWNLOAD = [
  // Project images
  {
    url: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/projects/ecommerce-platform.jpg'),
    description: 'E-Commerce Platform'
  },
  {
    url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/projects/task-management.jpg'),
    description: 'Task Management App'
  },
  {
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/projects/ai-image-generator.jpg'),
    description: 'AI Image Generator'
  },
  
  // Slideshow background images
  {
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/slideshow/coding-1.jpg'),
    description: 'Coding Background 1'
  },
  {
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/slideshow/coding-2.jpg'),
    description: 'Coding Background 2'
  },
  {
    url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/slideshow/coding-3.jpg'),
    description: 'Coding Background 3'
  },
  {
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/slideshow/coding-4.jpg'),
    description: 'Coding Background 4'
  },
  {
    url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/slideshow/coding-5.jpg'),
    description: 'Coding Background 5'
  },
  
  // Profile and placeholder images
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/placeholder.jpg'),
    description: 'Profile placeholder'
  },
  {
    url: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/placeholder-image.png'),
    description: 'Generic placeholder'
  },
  {
    url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=1000&auto=format&fit=crop',
    target: path.join(__dirname, '../../public/images/projects/placeholder.jpg'),
    description: 'Project placeholder'
  }
];

// Ensure directory exists
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

// Download a single image
function downloadImage(url, targetPath) {
  return new Promise((resolve, reject) => {
    // Make sure the target directory exists
    ensureDirectoryExists(targetPath);
    
    // Create a write stream for the target file
    const file = fs.createWriteStream(targetPath);
    
    // Download the image
    https.get(url, (response) => {
      // Check if response is successful
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      // Pipe the response to the file
      response.pipe(file);
      
      // Handle file close event
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      // Handle errors
      file.on('error', (err) => {
        fs.unlink(targetPath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(targetPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Main function to download all images
async function downloadAllImages() {
  console.log('🖼️ Downloading real images for the project...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const image of IMAGES_TO_DOWNLOAD) {
    try {
      process.stdout.write(`⏳ Downloading ${image.description}... `);
      await downloadImage(image.url, image.target);
      process.stdout.write('✅\n');
      successCount++;
    } catch (error) {
      process.stdout.write('❌\n');
      console.error(`   Error: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary: ${successCount} images downloaded successfully, ${errorCount} errors.`);
  
  if (successCount > 0) {
    console.log('🎉 Image download complete! Your project now has real images.');
  }
}

// Run the script
downloadAllImages().catch(console.error); 