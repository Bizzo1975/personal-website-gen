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
    // W40: the library sent no limit and the default of 50 silently hid every file after
    // the 50th (live has 71). Default and maximum are now 1000; `total` is always returned.
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '1000') || 1000, 1), 1000);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0);
    // W1c: folder=root -> files not in a folder; folder=<id> -> that folder; absent -> all.
    const folder = searchParams.get('folder');
    if (folder && folder !== 'root' && !/^\d+$/.test(folder)) {
      return NextResponse.json({ error: 'folder must be "root" or a folder id' }, { status: 400 });
    }

    const where: string[] = [];
    const params: any[] = [];
    if (contentType) { params.push(contentType); where.push(`content_type = $${params.length}`); }
    if (folder === 'root') where.push('folder IS NULL');
    else if (folder) { params.push(folder); where.push(`folder = $${params.length}`); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const result = await query(
      `SELECT id, filename, original_name, file_path, file_size, mime_type,
              content_type, alt_text, created_at, uploaded_by,
              starred, tags, folder, updated_at
         FROM media_files ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const countResult = await query(`SELECT COUNT(*) AS total FROM media_files ${whereClause}`, params);
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
        details: error instanceof Error ? error.message : 'Unknown error'
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

// DELETE: same checked deletion as /api/admin/media/delete (W22): files that are in use
// are refused unless { force: true }, and the real outcome is reported per file.
export { DELETE } from './delete/route';