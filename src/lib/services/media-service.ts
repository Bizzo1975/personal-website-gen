import { query } from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

/**
 * Media Service for File Management
 * Handles file uploads, organization by content type, and PostgreSQL metadata
 */

export interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  content_type: 'post' | 'project' | 'newsletter' | 'general';
  alt_text?: string;
  uploaded_by: string;
  created_at: Date;
}

export interface MediaUploadOptions {
  contentType: 'post' | 'project' | 'newsletter' | 'general';
  uploadedBy: string;
  altText?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  folder?: string | null;
}

export interface MediaFilterOptions {
  contentType?: string;
  mimeType?: string;
  uploadedBy?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export class MediaService {
  // Default upload settings
  private static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'application/json'
  ];

  /**
   * Upload a file with metadata storage
   */
  static async uploadFile(
    file: File, 
    options: MediaUploadOptions
  ): Promise<MediaFile> {
    try {
      // Validate file
      await this.validateFile(file, options);

      // W42: contentType is a directory name below public/uploads; only known values.
      if (!['post', 'project', 'newsletter', 'general'].includes(options.contentType)) {
        throw new Error('Invalid content type');
      }

      // Generate filename and paths
      const fileExtension = path.extname(file.name);
      const filename = `${uuidv4()}${fileExtension}`;
      const contentTypeFolder = options.contentType;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', contentTypeFolder);
      const filePath = path.join(uploadDir, filename);
      const publicPath = `/uploads/${contentTypeFolder}/${filename}`;

      // Ensure directory exists
      await fs.mkdir(uploadDir, { recursive: true });
      console.log(`📁 Upload directory: ${uploadDir}`);

      // Save file to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      
      // Verify file was written
      try {
        const stats = await fs.stat(filePath);
        if (stats.size !== file.size) {
          throw new Error(`File size mismatch: expected ${file.size}, got ${stats.size}`);
        }
        console.log(`✅ File written successfully: ${filePath} (${stats.size} bytes)`);
      } catch (verifyError) {
        console.error(`❌ File verification failed for ${filePath}:`, verifyError);
        throw new Error(`Failed to verify file was written: ${verifyError}`);
      }

      // Save metadata to database
      const result = await query(
        // W1c: the folder chosen in the library is stored (it was dropped, so every upload
        // landed at the top level).
        `INSERT INTO media_files 
         (id, filename, original_name, file_path, file_size, mime_type, content_type, alt_text, uploaded_by, folder)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [
          uuidv4(),
          filename,
          file.name,
          publicPath,
          file.size,
          file.type,
          options.contentType,
          options.altText || null,
          options.uploadedBy,
          options.folder || null
        ]
      );

      const mediaFile = result.rows[0] as MediaFile;
      console.log(`✅ Uploaded file: ${file.name} -> ${publicPath}`);
      console.log(`📂 File saved at: ${filePath}`);
      console.log(`🌐 Public URL: ${publicPath}`);
      
      // Double-check file exists and is readable
      try {
        const finalCheck = await fs.access(filePath);
        console.log(`✅ File accessibility verified: ${filePath}`);
      } catch (accessError) {
        console.error(`⚠️ File accessibility check failed: ${filePath}`, accessError);
        // Don't throw - file might still be accessible via web server
      }
      
      return mediaFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    files: File[],
    options: MediaUploadOptions
  ): Promise<MediaFile[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Get media files with filtering
   */
  static async getMediaFiles(filters: MediaFilterOptions = {}): Promise<{
    files: MediaFile[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        contentType,
        mimeType,
        uploadedBy,
        limit = 20,
        offset = 0,
        search
      } = filters;

      // Build WHERE conditions
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (contentType) {
        conditions.push(`content_type = $${paramIndex++}`);
        params.push(contentType);
      }

      if (mimeType) {
        conditions.push(`mime_type = $${paramIndex++}`);
        params.push(mimeType);
      }

      if (uploadedBy) {
        conditions.push(`uploaded_by = $${paramIndex++}`);
        params.push(uploadedBy);
      }

      if (search) {
        conditions.push(`(original_name ILIKE $${paramIndex++} OR alt_text ILIKE $${paramIndex++})`);
        params.push(`%${search}%`, `%${search}%`);
        paramIndex++; // account for two parameters
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM media_files ${whereClause}`;
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || '0');

      // Get files with pagination
      const filesQuery = `
        SELECT * FROM media_files 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(limit, offset);

      const filesResult = await query(filesQuery, params);

      return {
        files: filesResult.rows as MediaFile[],
        total,
        page: Math.floor(offset / limit) + 1,
        limit
      };
    } catch (error) {
      console.error('Error getting media files:', error);
      throw error;
    }
  }

  /**
   * Get media files by content type
   */
  static async getMediaByContentType(
    contentType: 'post' | 'project' | 'newsletter' | 'general',
    limit: number = 50
  ): Promise<MediaFile[]> {
    try {
      const result = await query(
        'SELECT * FROM media_files WHERE content_type = $1 ORDER BY created_at DESC LIMIT $2',
        [contentType, limit]
      );
      return result.rows as MediaFile[];
    } catch (error) {
      console.error(`Error getting ${contentType} media:`, error);
      throw error;
    }
  }

  /**
   * Get a single media file by ID
   */
  static async getMediaById(id: string): Promise<MediaFile | null> {
    try {
      const result = await query('SELECT * FROM media_files WHERE id = $1', [id]);
      return result.rows[0] as MediaFile || null;
    } catch (error) {
      console.error('Error getting media file:', error);
      throw error;
    }
  }

  /**
   * Update media file metadata
   */
  static async updateMediaFile(
    id: string,
    updates: Partial<Pick<MediaFile, 'alt_text' | 'content_type'>>
  ): Promise<MediaFile | null> {
    try {
      const setClause = [];
      const params = [];
      let paramIndex = 1;

      if (updates.alt_text !== undefined) {
        setClause.push(`alt_text = $${paramIndex++}`);
        params.push(updates.alt_text);
      }

      if (updates.content_type) {
        setClause.push(`content_type = $${paramIndex++}`);
        params.push(updates.content_type);
      }

      if (setClause.length === 0) {
        throw new Error('No updates provided');
      }

      params.push(id);
      const result = await query(
        `UPDATE media_files SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );

      return result.rows[0] as MediaFile || null;
    } catch (error) {
      console.error('Error updating media file:', error);
      throw error;
    }
  }

  /**
   * W22: where a media file is used. A path is matched as a substring, which covers
   * "/uploads/x.jpg", "/api/uploads/x.jpg" and absolute URLs ending in it.
   */
  static async findMediaUsage(filePath: string): Promise<string[]> {
    if (!filePath) return [];
    const like = '%' + filePath.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
    const r = await query(
      `SELECT 'post "' || title || '"' AS used_by FROM posts
        WHERE featured_image LIKE $1 OR content LIKE $1 OR draft_content LIKE $1
       UNION ALL
       SELECT 'project "' || title || '"' FROM projects
        WHERE image LIKE $1 OR content LIKE $1 OR draft_content LIKE $1 OR description LIKE $1
       UNION ALL
       SELECT 'page "' || COALESCE(title, slug, id::text) || '"' FROM pages WHERE content LIKE $1
       UNION ALL
       SELECT 'site setting "' || setting_key || '"' FROM site_settings WHERE setting_value LIKE $1
       UNION ALL
       SELECT 'profile image' FROM profiles WHERE image_url LIKE $1
       UNION ALL
       SELECT 'user profile image' FROM users WHERE profile_image LIKE $1
       UNION ALL
       SELECT 'newsletter campaign "' || title || '"' FROM newsletter_campaigns
        WHERE content LIKE $1 OR html_content LIKE $1`,
      [like]
    );
    return r.rows.map((row: { used_by: string }) => row.used_by);
  }

  /**
   * W22: delete a media file and report exactly what happened.
   * - Refuses (status 'in_use') when the file is used, unless force is true.
   * - Removes the file from disk only when it is an upload under public/uploads; images
   *   that are part of the site build (e.g. /images/...) are only removed from the library.
   * - A disk deletion that fails is reported, not hidden.
   */
  static async deleteMediaFileChecked(id: string, force = false): Promise<
    | { status: 'not_found' }
    | { status: 'in_use'; usedBy: string[] }
    | { status: 'deleted'; disk: 'deleted' | 'not_an_upload' | 'missing' | 'failed'; diskError?: string; usedBy: string[] }
  > {
    const mediaFile = await this.getMediaById(id);
    if (!mediaFile) return { status: 'not_found' };

    const usedBy = await this.findMediaUsage(mediaFile.file_path);
    if (usedBy.length > 0 && !force) return { status: 'in_use', usedBy };

    await query('DELETE FROM media_files WHERE id = $1', [id]);

    const rel = String(mediaFile.file_path || '').replace(/^\/api\//, '/');
    if (!rel.startsWith('/uploads/')) return { status: 'deleted', disk: 'not_an_upload', usedBy };
    const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
    const physicalPath = path.join(process.cwd(), 'public', rel);
    if (!physicalPath.startsWith(uploadsRoot + path.sep)) {
      return { status: 'deleted', disk: 'failed', diskError: 'Path is outside the uploads folder', usedBy };
    }
    try {
      await fs.unlink(physicalPath);
      return { status: 'deleted', disk: 'deleted', usedBy };
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return { status: 'deleted', disk: 'missing', usedBy };
      return { status: 'deleted', disk: 'failed', diskError: e instanceof Error ? e.message : String(e), usedBy };
    }
  }

  /** Kept for existing callers: true when the library entry was removed (forced). */
  static async deleteMediaFile(id: string): Promise<boolean> {
    const r = await this.deleteMediaFileChecked(id, true);
    return r.status === 'deleted';
  }

  /**
   * Get media library statistics
   */
  static async getMediaStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byContentType: Record<string, number>;
    byMimeType: Record<string, number>;
  }> {
    try {
      // Total files and size
      const totalResult = await query(
        'SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size FROM media_files'
      );

      // By content type
      const contentTypeResult = await query(
        'SELECT content_type, COUNT(*) as count FROM media_files GROUP BY content_type'
      );

      // By mime type
      const mimeTypeResult = await query(
        'SELECT mime_type, COUNT(*) as count FROM media_files GROUP BY mime_type'
      );

      const byContentType: Record<string, number> = {};
      contentTypeResult.rows.forEach((row: any) => {
        byContentType[row.content_type] = parseInt(row.count);
      });

      const byMimeType: Record<string, number> = {};
      mimeTypeResult.rows.forEach((row: any) => {
        byMimeType[row.mime_type] = parseInt(row.count);
      });

      return {
        totalFiles: parseInt(totalResult.rows[0]?.count || '0'),
        totalSize: parseInt(totalResult.rows[0]?.total_size || '0'),
        byContentType,
        byMimeType
      };
    } catch (error) {
      console.error('Error getting media stats:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  private static async validateFile(file: File, options: MediaUploadOptions): Promise<void> {
    const maxSize = options.maxSize || this.DEFAULT_MAX_SIZE;
    const allowedTypes = options.allowedTypes || this.DEFAULT_ALLOWED_TYPES;

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size ${file.size} exceeds maximum allowed size ${maxSize}`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check filename
    if (!file.name || file.name.trim() === '') {
      throw new Error('File must have a valid name');
    }
  }

  /**
   * Get content type folder structure
   */
  static getContentTypeFolders(): Record<string, string> {
    return {
      post: 'posts',
      project: 'projects', 
      newsletter: 'newsletters',
      general: 'general'
    };
  }

  /**
   * Clean up orphaned files (files without database records)
   */
  static async cleanupOrphanedFiles(): Promise<{
    deletedFiles: string[];
    errors: string[];
  }> {
    const deletedFiles = [];
    const errors = [];

    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      const contentTypes = ['post', 'project', 'newsletter', 'general'];

      for (const contentType of contentTypes) {
        const contentDir = path.join(uploadsDir, contentType);
        
        try {
          const files = await fs.readdir(contentDir);
          
          for (const filename of files) {
            const filePath = `/uploads/${contentType}/${filename}`;
            
            // Check if file exists in database
            const result = await query(
              'SELECT id FROM media_files WHERE file_path = $1',
              [filePath]
            );
            
            if (result.rows.length === 0) {
              // File not in database, delete it
              const physicalPath = path.join(contentDir, filename);
              await fs.unlink(physicalPath);
              deletedFiles.push(filePath);
            }
          }
        } catch (dirError) {
          errors.push(`Could not process directory ${contentType}: ${dirError instanceof Error ? dirError.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { deletedFiles, errors };
  }
} 