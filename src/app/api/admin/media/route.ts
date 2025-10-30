import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { MediaService } from '@/lib/services/media-service';
import { autoResizeForProject } from '@/lib/utils/server-image-resize';

/**
 * Admin Media API Routes
 * GET: List media files with filtering
 * POST: Upload new media files
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📄 Starting media files fetch...');

    // Quick check if table exists
    try {
      await query('SELECT 1 FROM media_files LIMIT 1');
      console.log('✅ media_files table exists');
    } catch (tableError) {
      console.error('❌ media_files table check failed:', tableError);
      return NextResponse.json({
        error: 'media_files table does not exist',
        solution: 'Please run the setup_media_table.sql script to create the table',
        details: tableError instanceof Error ? tableError.message : 'Unknown error'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Simplified query approach
    let sqlQuery: string;
    let queryParams: any[];

    if (contentType) {
      sqlQuery = `
        SELECT id, filename, original_name, file_path, file_size, mime_type, 
               content_type, alt_text, created_at, uploaded_by,
               starred, tags, folder, updated_at
        FROM media_files 
        WHERE content_type = $1
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      queryParams = [contentType, limit, offset];
    } else {
      sqlQuery = `
        SELECT id, filename, original_name, file_path, file_size, mime_type, 
               content_type, alt_text, created_at, uploaded_by,
               starred, tags, folder, updated_at
        FROM media_files 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      queryParams = [limit, offset];
    }

    console.log('📊 Executing query:', { contentType, limit, offset });
    const result = await query(sqlQuery, queryParams);
    console.log('✅ Query successful, found', result.rows.length, 'files');

    // Get total count
    const countQuery = contentType 
      ? 'SELECT COUNT(*) as total FROM media_files WHERE content_type = $1'
      : 'SELECT COUNT(*) as total FROM media_files';
    const countParams = contentType ? [contentType] : [];
    
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0');

    console.log('📋 Total files:', total);

    return NextResponse.json({
      media: result.rows,
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error('❌ Media API error:', error);
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Failed to fetch media files',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const altText = formData.get('altText') as string;
    const contentType = formData.get('contentType') as string || 'general';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate content type
    const validContentTypes = ['post', 'project', 'newsletter', 'general'];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Get the user's ID from the database
    const userQuery = await query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userQuery.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userQuery.rows[0].id;

    console.log('📁 Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      contentType: contentType,
      userId: userId
    });

    // Auto-resize images for projects
    let fileToUpload = file;
    if (contentType === 'project' && file.type.startsWith('image/')) {
      try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const resizedResult = await autoResizeForProject(fileBuffer, file.type, 'card');
        
        if (resizedResult) {
          console.log('🔄 Image resized:', {
            originalSize: file.size,
            newSize: resizedResult.size,
            reduction: `${(((file.size - resizedResult.size) / file.size) * 100).toFixed(1)}%`
          });
          
          // Create a new File object with the resized data
          fileToUpload = new File([resizedResult.buffer], file.name, {
            type: `image/${resizedResult.format}`
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to auto-resize image, using original:', error);
      }
    }

    const uploadResult = await MediaService.uploadFile(fileToUpload, {
      contentType: contentType as 'post' | 'project' | 'newsletter' | 'general',
      altText: altText || '',
      uploadedBy: userId
    });

    console.log('✅ Upload successful:', uploadResult);

    return NextResponse.json(uploadResult);

  } catch (error) {
    console.error('❌ Media upload error:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = {
      error: 'Failed to upload media file',
      details: errorMessage,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorDetails, { status: 500 });
  }
}

// DELETE: Delete multiple files (for bulk operations)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileIds } = await request.json();

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'No file IDs provided' },
        { status: 400 }
      );
    }

    const results = [];
    for (const fileId of fileIds) {
      try {
        const deleted = await MediaService.deleteMediaFile(fileId);
        results.push({ id: fileId, deleted, error: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ id: fileId, deleted: false, error: errorMessage });
      }
    }

    const successCount = results.filter(r => r.deleted).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: failCount === 0,
      message: `Deleted ${successCount} file(s)${failCount > 0 ? `, failed to delete ${failCount}` : ''}`,
      results
    });

  } catch (error) {
    console.error('Error deleting media files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete files',
        message: errorMessage 
      },
      { status: 500 }
    );
  }
} 

