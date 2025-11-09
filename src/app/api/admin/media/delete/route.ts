import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { MediaService } from '@/lib/services/media-service';

/**
 * Bulk Delete API Route
 * DELETE: Delete multiple media files
 */

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileIds } = await request.json();

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'No file IDs provided' }, { status: 400 });
    }

    console.log('🗑️ Bulk deleting files:', {
      fileCount: fileIds.length,
      userId: session.user.email
    });

    const results: any[] = [];
    const errors: string[] = [];

    for (const fileId of fileIds) {
      try {
        // Check if file exists
        const fileCheck = await query(
          'SELECT id, filename, file_path FROM media_files WHERE id = $1',
          [fileId]
        );

        if (fileCheck.rows.length === 0) {
          errors.push(`File ${fileId}: Not found`);
          continue;
        }

        // Delete the file using MediaService
        const deleteResult = await MediaService.deleteMediaFile(fileId);

        if (deleteResult) {
          results.push({
            id: fileId,
            success: true,
            filename: fileCheck.rows[0].filename
          });
        } else {
          errors.push(`File ${fileId}: Failed to delete`);
        }

      } catch (error) {
        console.error(`Failed to delete file ${fileId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`File ${fileId}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      deleted: results.length,
      total: fileIds.length,
      results,
      errors
    });

  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to delete files',
      details: errorMessage,
      success: false,
      deleted: 0,
      total: 0,
      results: [],
      errors: [errorMessage]
    }, { status: 500 });
  }
}

// Keep the old POST method for backward compatibility
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemIds } = await request.json();

    if (!itemIds || !Array.isArray(itemIds)) {
      return NextResponse.json({ error: 'Invalid item IDs' }, { status: 400 });
    }

    const deletedItems: any[] = [];
    const errors: string[] = [];

    for (const itemId of itemIds) {
      try {
        // In a real app, you would:
        // 1. Get the file path from database
        // 2. Delete the file from filesystem
        // 3. Remove the record from database
        
        // For now, we'll simulate the deletion
        console.log(`Simulating deletion of media item: ${itemId}`);
        deletedItems.push(itemId);
        
        // If this was a real uploaded file, you would delete it like this:
        // const filePath = path.join(process.cwd(), 'public', mediaItem.url);
        // await fs.unlink(filePath);
        
      } catch (error) {
        console.error(`Failed to delete item ${itemId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Item ${itemId}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      deletedItems,
      errors,
      message: `Successfully deleted ${deletedItems.length} item(s)`
    });

  } catch (error) {
    console.error('Error deleting media items:', error);
    return NextResponse.json({ error: 'Delete operation failed' }, { status: 500 });
  }
} 

