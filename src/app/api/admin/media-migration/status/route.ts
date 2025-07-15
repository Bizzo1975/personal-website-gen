import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

/**
 * Media Migration Status API
 * GET: Check migration status
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if any images have been migrated already
    const result = await query(
      `SELECT id, filename, original_name, file_path, alt_text, created_at
       FROM media_files 
       WHERE (alt_text ILIKE '%slideshow%' OR alt_text ILIKE '%logo%' OR alt_text ILIKE '%profile%')
       ORDER BY created_at DESC`
    );

    // Map the expected migration items
    const expectedItems = [
      { path: '/images/jlk-logo.png', category: 'logo', description: 'Website Logo (PNG)' },
      { path: '/images/jlk-logo.svg', category: 'logo', description: 'Website Logo (SVG)' },
      { path: '/images/slideshow/coding-1.jpg', category: 'slideshow', description: 'Background slideshow - coding workspace' },
      { path: '/images/slideshow/coding-2.jpg', category: 'slideshow', description: 'Background slideshow - developer environment' },
      { path: '/images/slideshow/coding-3.jpg', category: 'slideshow', description: 'Background slideshow - programming setup' },
      { path: '/images/slideshow/coding-4.jpg', category: 'slideshow', description: 'Background slideshow - tech workspace' },
      { path: '/images/slideshow/coding-5.jpg', category: 'slideshow', description: 'Background slideshow - development tools' },
      { path: '/images/profiles/9197d18e-f756-4777-8122-62a73db8ff89.jpg', category: 'profile', description: 'Profile photo 1' },
      { path: '/images/profiles/7245626d-1e82-4e58-807c-d02b0720260a.jpg', category: 'profile', description: 'Profile photo 2' }
    ];

    const migratedItems = expectedItems.map(item => {
      // Try to find a corresponding migrated file
      const migrated = result.rows.find(row => {
        const originalName = row.original_name.toLowerCase();
        const itemName = item.path.split('/').pop()?.toLowerCase();
        return originalName === itemName;
      });

      return {
        category: item.category,
        originalPath: item.path,
        description: item.description,
        migrated: !!migrated,
        mediaFileId: migrated?.id,
        error: undefined
      };
    });

    const migratedCount = migratedItems.filter(item => item.migrated).length;
    const totalCount = migratedItems.length;

    return NextResponse.json({
      migrated: migratedCount > 0,
      completed: migratedCount === totalCount,
      items: migratedItems,
      stats: {
        total: totalCount,
        migrated: migratedCount,
        remaining: totalCount - migratedCount
      }
    });

  } catch (error) {
    console.error('Error checking migration status:', error);
    return NextResponse.json({ error: 'Failed to check migration status' }, { status: 500 });
  }
} 