import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

/**
 * Bulk Tag API Route
 * POST: Add tags to multiple files
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileIds, tags } = await request.json();
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'No file IDs provided' }, { status: 400 });
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'No tags provided' }, { status: 400 });
    }

    console.log('🏷️ Bulk tagging files:', {
      fileCount: fileIds.length,
      tags: tags,
      userId: session.user.email
    });

    const results = [];
    const errors = [];

    for (const fileId of fileIds) {
      try {
        // Check if file exists
        const fileCheck = await query(
          'SELECT id, tags FROM media_files WHERE id = $1',
          [fileId]
        );

        if (fileCheck.rows.length === 0) {
          errors.push(`File ${fileId}: Not found`);
          continue;
        }

        // Get existing tags
        const existingTags = fileCheck.rows[0].tags || [];
        
        // Merge with new tags, removing duplicates
        const mergedTags = [...new Set([...existingTags, ...tags])];

        // Update the file with merged tags
        const updateResult = await query(
          `UPDATE media_files 
           SET tags = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING id, tags`,
          [JSON.stringify(mergedTags), fileId]
        );

        if (updateResult.rows.length > 0) {
          results.push({
            id: fileId,
            success: true,
            tags: JSON.parse(updateResult.rows[0].tags || '[]')
          });
        } else {
          errors.push(`File ${fileId}: Failed to update`);
        }

      } catch (error) {
        console.error(`Failed to tag file ${fileId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`File ${fileId}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      processed: results.length,
      total: fileIds.length,
      results,
      errors
    });

  } catch (error) {
    console.error('❌ Bulk tag error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to tag files',
      details: errorMessage,
      success: false,
      processed: 0,
      total: 0,
      results: [],
      errors: [errorMessage]
    }, { status: 500 });
  }
} 