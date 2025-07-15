import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { MediaService } from '@/lib/services/media-service';

/**
 * Individual Media File API Routes
 * GET: Get media file by ID
 * PUT: Update media file metadata
 * DELETE: Delete media file
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT id, filename, original_name, type, size, url, alt_text, 
              created_at, updated_at, created_by
       FROM media_files 
       WHERE id = $1`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Media get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media file' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { altText, filename } = await request.json();

    const result = await query(
      `UPDATE media_files 
       SET alt_text = $1, original_name = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [altText, filename, params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Media update error:', error);
    return NextResponse.json(
      { error: 'Failed to update media file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleteResult = await MediaService.deleteMediaFile(params.id);

    if (!deleteResult) {
      return NextResponse.json(
        { error: 'Failed to delete media file' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Media file deleted successfully' });

  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    );
  }
} 