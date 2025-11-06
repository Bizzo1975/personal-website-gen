/**
 * Server-side image resizing utilities
 * Uses sharp for high-quality image processing
 */

import sharp from 'sharp';

export interface ServerResizeOptions {
  width: number;
  height: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

export interface ServerResizeResult {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
}

/**
 * Resize image using Sharp
 */
export async function resizeImageServer(
  inputBuffer: Buffer,
  options: ServerResizeOptions
): Promise<ServerResizeResult> {
  const {
    width,
    height,
    quality = 90,
    format = 'jpeg',
    maintainAspectRatio = true
  } = options;

  let sharpInstance = sharp(inputBuffer);

  // Get original metadata
  const metadata = await sharpInstance.metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // Calculate optimal dimensions
  let newWidth = width;
  let newHeight = height;

  if (maintainAspectRatio) {
    const aspectRatio = originalWidth / originalHeight;
    const targetAspectRatio = width / height;

    if (aspectRatio > targetAspectRatio) {
      // Image is wider than target - fit to width
      newWidth = width;
      newHeight = Math.round(width / aspectRatio);
    } else {
      // Image is taller than target - fit to height
      newHeight = height;
      newWidth = Math.round(height * aspectRatio);
    }
  }

  // Apply resizing
  sharpInstance = sharpInstance.resize(newWidth, newHeight, {
    fit: 'cover',
    position: 'center'
  });

  // Apply format and quality
  switch (format) {
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({ quality });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({ quality });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality });
      break;
  }

  const outputBuffer = await sharpInstance.toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: outputMetadata.width || newWidth,
    height: outputMetadata.height || newHeight,
    size: outputBuffer.length,
    format: outputMetadata.format || format
  };
}

/**
 * Project-specific resize configurations
 */
export const PROJECT_RESIZE_CONFIGS = {
  card: {
    width: 600,
    height: 400,
    quality: 85,
    format: 'jpeg' as const,
    maintainAspectRatio: true
  },
  detail: {
    width: 800,
    height: 400,
    quality: 90,
    format: 'jpeg' as const,
    maintainAspectRatio: true
  },
  thumbnail: {
    width: 300,
    height: 200,
    quality: 80,
    format: 'jpeg' as const,
    maintainAspectRatio: true
  }
} as const;

/**
 * Check if image needs resizing
 */
export function needsResizingServer(
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
 * Auto-resize image for project display
 */
export async function autoResizeForProject(
  inputBuffer: Buffer,
  contentType: string,
  type: 'card' | 'detail' | 'thumbnail' = 'card'
): Promise<ServerResizeResult | null> {
  // Only resize images
  if (!contentType.startsWith('image/')) {
    return null;
  }

  try {
    // Get original dimensions
    const metadata = await sharp(inputBuffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    // Get resize config
    const config = PROJECT_RESIZE_CONFIGS[type];

    // Check if resizing is needed
    if (!needsResizingServer(originalWidth, originalHeight, config.width, config.height)) {
      return null;
    }

    // Resize the image
    return await resizeImageServer(inputBuffer, config);
  } catch (error) {
    console.error('Error auto-resizing image:', error);
    return null;
  }
}





