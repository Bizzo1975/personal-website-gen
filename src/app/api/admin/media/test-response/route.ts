import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

/**
 * Test endpoint to verify media API response structure
 * GET: Test the media API response format
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 Testing media API response structure...');

    // Test the same query as the main media API
    const sqlQuery = `
      SELECT id, filename, original_name, file_path, file_size, mime_type, 
             content_type, alt_text, created_at, uploaded_by,
             starred, tags, folder, updated_at
      FROM media_files 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    const result = await query(sqlQuery);
    
    console.log('✅ Query successful, found', result.rows.length, 'test files');

    // Test the mapping that the component expects
    const mediaFiles = result.rows.map((file: any) => ({
      id: file.id,
      filename: file.filename,
      originalName: file.original_name || file.filename,
      mimeType: file.mime_type,
      size: file.file_size,
      url: file.file_path,
      thumbnailUrl: file.thumbnail_url,
      uploadedAt: file.created_at,
      uploadedBy: file.uploaded_by,
      folder: file.folder,
      alt: file.alt_text,
      description: file.description,
      tags: file.tags || [],
      starred: file.starred || false
    }));

    return NextResponse.json({
      success: true,
      message: 'Media API test successful',
      rawData: result.rows,
      mappedData: mediaFiles,
      counts: {
        total: result.rows.length,
        starred: mediaFiles.filter(f => f.starred).length,
        withTags: mediaFiles.filter(f => f.tags && f.tags.length > 0).length,
        withFolders: mediaFiles.filter(f => f.folder).length
      }
    });

  } catch (error) {
    console.error('❌ Media API test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test media API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 