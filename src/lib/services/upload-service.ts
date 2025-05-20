/**
 * Upload Service
 * 
 * Handles file uploads for the admin section, particularly for rich text editor images
 */

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

// Supported image types
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Upload directories
const UPLOAD_ROOT = path.join(process.cwd(), 'public/uploads');
const UPLOAD_DIRS = {
  images: path.join(UPLOAD_ROOT, 'images'),
  documents: path.join(UPLOAD_ROOT, 'documents')
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
export async function ensureUploadDirs(): Promise<void> {
  try {
    // Check if root upload directory exists
    try {
      await fs.access(UPLOAD_ROOT);
    } catch {
      await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    }
    
    // Check and create each subdirectory
    for (const dir of Object.values(UPLOAD_DIRS)) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  } catch (error) {
    console.error('Error ensuring upload directories:', error);
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
  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    return {
      success: false,
      error: `Unsupported image type: ${mimeType}. Supported types: ${SUPPORTED_IMAGE_TYPES.join(', ')}`
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
    const filePath = path.join(UPLOAD_DIRS.images, uniqueFileName);
    
    // Write file to disk
    await fs.writeFile(filePath, file);
    
    // Return the URL (relative to the public directory)
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
    
    const filePath = path.join(process.cwd(), 'public', fileUrl);
    
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
