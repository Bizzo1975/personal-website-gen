import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { MediaService } from '@/lib/services/media-service';

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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = '';
    const params = [limit, offset];

    if (type) {
      whereClause = 'WHERE type = $3';
      params.push(type);
    }

    const result = await query(
      `SELECT id, filename, original_name, type, size, url, alt_text, 
              created_at, updated_at, created_by
       FROM media_files 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM media_files ${whereClause}`,
      type ? [type] : []
    );

    return NextResponse.json({
      media: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });

  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media files' },
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
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const uploadResult = await MediaService.uploadFile(file, {
      altText: altText || '',
      uploadedBy: session.user.id
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json(uploadResult.data);

  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload media file' },
      { status: 500 }
    );
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
        results.push({ id: fileId, deleted: false, error: error.message });
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
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete files',
        message: error.message 
      },
      { status: 500 }
    );
  }
} 

