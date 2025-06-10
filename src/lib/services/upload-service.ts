/**
 * Upload Service
 * 
 * Handles file uploads for the admin section, particularly for rich text editor images
 */

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { config, pathUtils } from '@/lib/config';

// Supported image types
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = config.uploads.maxFileSize;

// Upload directories - using Windows-compatible paths
const UPLOAD_ROOT = pathUtils.resolve(pathUtils.join(process.cwd(), 'public', 'uploads'));
const UPLOAD_DIRS = {
  images: pathUtils.resolve(pathUtils.join(UPLOAD_ROOT, 'images')),
  documents: pathUtils.resolve(pathUtils.join(UPLOAD_ROOT, 'documents'))
};

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

/**
 * Ensure upload directories exist
 */
async function ensureUploadDirs(): Promise<void> {
  try {
    for (const dir of Object.values(UPLOAD_DIRS)) {
      await fs.mkdir(dir, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw new Error('Failed to create upload directories');
  }
}

/**
 * Upload an image file
 * 
 * @param file The file buffer to upload
 * @param fileName Original file name
 * @param mimeType File MIME type
 * @returns Upload result with URL or error
 */
export async function uploadImage(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  // Validate file type
  if (!config.uploads.allowedImageTypes.includes(mimeType)) {
    return {
      success: false,
      error: `Unsupported image type: ${mimeType}. Supported types: ${config.uploads.allowedImageTypes.join(', ')}`
    };
  }
  
  // Validate file size
  if (file.length > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large: ${(file.length / 1024 / 1024).toFixed(2)}MB. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }
  
  try {
    // Ensure upload directories exist
    await ensureUploadDirs();
    
    // Generate a unique filename
    const fileExt = path.extname(fileName);
    const uniqueFileName = `${uuidv4()}${fileExt}`;
    const filePath = pathUtils.resolve(pathUtils.join(UPLOAD_DIRS.images, uniqueFileName));
    
    // Write file to disk
    await fs.writeFile(filePath, file);
    
    // Return the URL (relative to the public directory) - always use forward slashes for URLs
    return {
      success: true,
      url: `/uploads/images/${uniqueFileName}`,
      fileName: uniqueFileName,
      fileSize: file.length,
      mimeType
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: 'Failed to upload image'
    };
  }
}

/**
 * Delete an uploaded file
 * 
 * @param fileUrl URL of the file to delete (relative to public directory)
 * @returns Whether deletion was successful
 */
export async function deleteUploadedFile(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl.startsWith('/uploads/')) {
      return false;
    }
    
    // Convert URL path to file system path
    const relativePath = fileUrl.replace(/^\/uploads\//, '');
    const filePath = pathUtils.resolve(pathUtils.join(UPLOAD_ROOT, relativePath));
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return false;
    }
    
    // Delete the file
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}
