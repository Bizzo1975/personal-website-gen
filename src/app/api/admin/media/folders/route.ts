import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

/**
 * Media Folders API Route
 * GET: List all folders
 * POST: Create a new folder
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📁 Fetching media folders...');

    // Get all folders with file counts
    const foldersQuery = `
      SELECT 
        mf.id,
        mf.name,
        mf.parent_id,
        mf.created_at,
        COALESCE(COUNT(files.id), 0) as file_count
      FROM media_folders mf
      LEFT JOIN media_files files ON files.folder = mf.id
      GROUP BY mf.id, mf.name, mf.parent_id, mf.created_at
      ORDER BY mf.created_at DESC
    `;

    const result = await query(foldersQuery);

    const folders = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      fileCount: parseInt(row.file_count || '0'),
      createdAt: row.created_at
    }));

    return NextResponse.json(folders);

  } catch (error) {
    console.error('❌ Folders fetch error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to fetch folders',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, parentId } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Validate parent folder exists if provided
    if (parentId) {
      const parentCheck = await query(
        'SELECT id FROM media_folders WHERE id = $1',
        [parentId]
      );

      if (parentCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }
    }

    console.log('📁 Creating new folder:', {
      name: name.trim(),
      parentId: parentId || null,
      userId: session.user.email
    });

    // Check if folder with same name already exists in same parent
    const existingCheck = await query(
      'SELECT id FROM media_folders WHERE name = $1 AND parent_id = $2',
      [name.trim(), parentId || null]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json({ 
        error: 'A folder with this name already exists in the selected location' 
      }, { status: 400 });
    }

    // Create the folder
    const createResult = await query(
      `INSERT INTO media_folders (name, parent_id, created_at, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, parent_id, created_at`,
      [name.trim(), parentId || null]
    );

    if (createResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }

    const newFolder = createResult.rows[0];

    return NextResponse.json({
      success: true,
      folder: {
        id: newFolder.id,
        name: newFolder.name,
        parentId: newFolder.parent_id,
        fileCount: 0,
        createdAt: newFolder.created_at
      }
    });

  } catch (error) {
    console.error('❌ Folder creation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to create folder',
      details: errorMessage,
      success: false
    }, { status: 500 });
  }
} 