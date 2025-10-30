/**
 * Image resizing utilities for project images
 * Automatically resizes images to fit project display dimensions
 */

export interface ImageResizeOptions {
  width: number;
  height: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

export interface ResizeResult {
  resized: boolean;
  originalSize: { width: number; height: number };
  newSize: { width: number; height: number };
  fileSize: number;
  dataUrl: string;
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
  maintainAspectRatio: boolean = true
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return { width: targetWidth, height: targetHeight };
  }

  const aspectRatio = originalWidth / originalHeight;
  const targetAspectRatio = targetWidth / targetHeight;

  let newWidth: number;
  let newHeight: number;

  if (aspectRatio > targetAspectRatio) {
    // Image is wider than target - fit to width
    newWidth = targetWidth;
    newHeight = Math.round(targetWidth / aspectRatio);
  } else {
    // Image is taller than target - fit to height
    newHeight = targetHeight;
    newWidth = Math.round(targetHeight * aspectRatio);
  }

  return { width: newWidth, height: newHeight };
}

/**
 * Resize an image using HTML5 Canvas
 */
export async function resizeImage(
  file: File,
  options: ImageResizeOptions
): Promise<ResizeResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      const { width: originalWidth, height: originalHeight } = img;
      
      console.log('Image loaded for resizing:', {
        originalWidth,
        originalHeight,
        targetWidth: options.width,
        targetHeight: options.height,
        aspectRatio: originalWidth / originalHeight,
        targetAspectRatio: options.width / options.height
      });
      
      // Calculate optimal dimensions
      const { width: newWidth, height: newHeight } = calculateOptimalDimensions(
        originalWidth,
        originalHeight,
        options.width,
        options.height,
        options.maintainAspectRatio
      );

      console.log('Calculated new dimensions:', { 
        newWidth, 
        newHeight,
        actualReduction: {
          width: ((originalWidth - newWidth) / originalWidth * 100).toFixed(1) + '%',
          height: ((originalHeight - newHeight) / originalHeight * 100).toFixed(1) + '%'
        }
      });

      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Configure canvas for high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the resized image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create resized image blob'));
            return;
          }

          console.log('Resized blob created:', {
            size: blob.size,
            type: blob.type
          });

          // Create data URL
          const reader = new FileReader();
          reader.onload = () => {
            const result = {
              resized: true,
              originalSize: { width: originalWidth, height: originalHeight },
              newSize: { width: newWidth, height: newHeight },
              fileSize: blob.size,
              dataUrl: reader.result as string
            };
            
            console.log('Resize result:', result);
            resolve(result);
          };
          reader.readAsDataURL(blob);
        },
        `image/${options.format || 'jpeg'}`,
        options.quality || 0.9
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Project-specific image resize configurations
 */
export const PROJECT_IMAGE_CONFIGS = {
  // For project cards (3:2 aspect ratio)
  card: {
    width: 600,
    height: 400,
    quality: 0.85,
    format: 'jpeg' as const,
    maintainAspectRatio: true
  },
  
  // For project detail pages (2:1 aspect ratio)
  detail: {
    width: 800,
    height: 400,
    quality: 0.9,
    format: 'jpeg' as const,
    maintainAspectRatio: true
  },
  
  // For thumbnails
  thumbnail: {
    width: 300,
    height: 200,
    quality: 0.8,
    format: 'jpeg' as const,
    maintainAspectRatio: true
  }
} as const;

/**
 * Resize image for project display
 */
export async function resizeForProject(
  file: File,
  type: 'card' | 'detail' | 'thumbnail' = 'card'
): Promise<ResizeResult> {
  const config = PROJECT_IMAGE_CONFIGS[type];
  return resizeImage(file, config);
}

/**
 * Check if image needs resizing
 */
export function needsResizing(
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number,
  tolerance: number = 0.1
): boolean {
  const widthRatio = Math.abs(width - targetWidth) / targetWidth;
  const heightRatio = Math.abs(height - targetHeight) / targetHeight;
  
  return widthRatio > tolerance || heightRatio > tolerance;
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
