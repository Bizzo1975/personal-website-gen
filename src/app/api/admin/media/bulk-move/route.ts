import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

/**
 * Bulk Move API Route
 * POST: Move multiple files to a different folder
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileIds, folderId } = await request.json();
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'No file IDs provided' }, { status: 400 });
    }

    // folderId can be null (root folder) or a valid folder ID
    if (folderId && typeof folderId !== 'string') {
      return NextResponse.json({ error: 'Invalid folder ID' }, { status: 400 });
    }

    console.log('📁 Bulk moving files:', {
      fileCount: fileIds.length,
      targetFolder: folderId || 'root',
      userId: session.user.email
    });

    // If folderId is provided, verify it exists
    if (folderId) {
      const folderCheck = await query(
        'SELECT id FROM media_folders WHERE id = $1',
        [folderId]
      );

      if (folderCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Target folder not found' }, { status: 404 });
      }
    }

    const results = [];
    const errors = [];

    for (const fileId of fileIds) {
      try {
        // Check if file exists
        const fileCheck = await query(
          'SELECT id, folder FROM media_files WHERE id = $1',
          [fileId]
        );

        if (fileCheck.rows.length === 0) {
          errors.push(`File ${fileId}: Not found`);
          continue;
        }

        // Update the file's folder
        const updateResult = await query(
          `UPDATE media_files 
           SET folder = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING id, folder`,
          [folderId, fileId]
        );

        if (updateResult.rows.length > 0) {
          results.push({
            id: fileId,
            success: true,
            newFolder: updateResult.rows[0].folder
          });
        } else {
          errors.push(`File ${fileId}: Failed to update`);
        }

      } catch (error) {
        console.error(`Failed to move file ${fileId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`File ${fileId}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      moved: results.length,
      total: fileIds.length,
      targetFolder: folderId || 'root',
      results,
      errors
    });

  } catch (error) {
    console.error('❌ Bulk move error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to move files',
      details: errorMessage,
      success: false,
      moved: 0,
      total: 0,
      results: [],
      errors: [errorMessage]
    }, { status: 500 });
  }
} 