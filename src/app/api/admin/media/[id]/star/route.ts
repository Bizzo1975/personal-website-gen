import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

/**
 * File Star API Route
 * POST: Toggle star status for a media file
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = resolvedParams.id;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    console.log('⭐ Toggling star for file:', {
      fileId,
      userId: session.user.email
    });

    // Check if file exists and get current star status
    const fileCheck = await query(
      'SELECT id, starred FROM media_files WHERE id = $1',
      [fileId]
    );

    if (fileCheck.rows.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const currentStarred = fileCheck.rows[0].starred || false;
    const newStarred = !currentStarred;

    // Update the star status
    const updateResult = await query(
      `UPDATE media_files 
       SET starred = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, starred`,
      [newStarred, fileId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update star status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      fileId,
      starred: updateResult.rows[0].starred,
      message: newStarred ? 'File starred' : 'File unstarred'
    });

  } catch (error) {
    console.error('❌ Star toggle error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to toggle star status',
      details: errorMessage,
      success: false
    }, { status: 500 });
  }
} 