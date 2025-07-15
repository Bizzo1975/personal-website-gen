import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { MediaService } from '@/lib/services/media-service';
import { query } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Media Migration API
 * POST: Migrate existing images to media library
 */

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create a readable stream for real-time updates
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Run migration in background
      runMigration(controller, encoder, session.user.email!)
        .finally(() => {
          controller.close();
        });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    }
  });
}

async function runMigration(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  userEmail: string
) {
  const sendUpdate = (data: any) => {
    controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
  };

  try {
    sendUpdate({ type: 'progress', progress: 0, message: 'Starting migration...' });

    // Get admin user ID
    const userResult = await query('SELECT id FROM users WHERE email = $1', [userEmail]);
    if (userResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }
    const adminUserId = userResult.rows[0].id;

    // Define migration items
    const migrationItems = [
      {
        originalPath: 'public/images/jlk-logo.png',
        contentType: 'general' as const,
        altText: 'Website Logo',
        category: 'branding'
      },
      {
        originalPath: 'public/images/jlk-logo.svg',
        contentType: 'general' as const,
        altText: 'Website Logo (SVG)',
        category: 'branding'
      },
      {
        originalPath: 'public/images/slideshow/coding-1.jpg',
        contentType: 'general' as const,
        altText: 'Background slideshow image - coding workspace',
        category: 'slideshow'
      },
      {
        originalPath: 'public/images/slideshow/coding-2.jpg',
        contentType: 'general' as const,
        altText: 'Background slideshow image - developer environment',
        category: 'slideshow'
      },
      {
        originalPath: 'public/images/slideshow/coding-3.jpg',
        contentType: 'general' as const,
        altText: 'Background slideshow image - programming setup',
        category: 'slideshow'
      },
      {
        originalPath: 'public/images/slideshow/coding-4.jpg',
        contentType: 'general' as const,
        altText: 'Background slideshow image - tech workspace',
        category: 'slideshow'
      },
      {
        originalPath: 'public/images/slideshow/coding-5.jpg',
        contentType: 'general' as const,
        altText: 'Background slideshow image - development tools',
        category: 'slideshow'
      },
      {
        originalPath: 'public/images/profiles/9197d18e-f756-4777-8122-62a73db8ff89.jpg',
        contentType: 'general' as const,
        altText: 'Profile photo',
        category: 'profile'
      },
      {
        originalPath: 'public/images/profiles/7245626d-1e82-4e58-807c-d02b0720260a.jpg',
        contentType: 'general' as const,
        altText: 'Profile photo',
        category: 'profile'
      }
    ];

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'general');
    await fs.mkdir(uploadsDir, { recursive: true });

    let migratedFiles: any[] = [];
    let processedCount = 0;

    for (const migration of migrationItems) {
      const { originalPath, contentType, altText, category } = migration;
      
      sendUpdate({ 
        type: 'progress', 
        progress: (processedCount / migrationItems.length) * 90,
        message: `Processing: ${path.basename(originalPath)}...`
      });

      try {
        // Check if file exists
        const fullPath = path.join(process.cwd(), originalPath);
        await fs.access(fullPath);

        // Read file
        const fileBuffer = await fs.readFile(fullPath);
        const stats = await fs.stat(fullPath);
        const originalName = path.basename(originalPath);
        const fileExtension = path.extname(originalName);
        
        // Generate new filename
        const newFilename = `${category}-${uuidv4()}${fileExtension}`;
        const newFilePath = path.join(uploadsDir, newFilename);
        const publicPath = `/uploads/general/${newFilename}`;
        
        // Determine MIME type
        let mimeType = 'application/octet-stream';
        const ext = fileExtension.toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') {
          mimeType = 'image/jpeg';
        } else if (ext === '.png') {
          mimeType = 'image/png';
        } else if (ext === '.svg') {
          mimeType = 'image/svg+xml';
        }

        // Copy file to uploads directory
        await fs.copyFile(fullPath, newFilePath);

        // Insert into database
        const insertResult = await query(
          `INSERT INTO media_files 
           (id, filename, original_name, file_path, file_size, mime_type, content_type, alt_text, uploaded_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
           RETURNING *`,
          [
            uuidv4(),
            newFilename,
            originalName,
            publicPath,
            stats.size,
            mimeType,
            contentType,
            altText,
            adminUserId
          ]
        );

        const mediaFile = insertResult.rows[0];
        migratedFiles.push({
          category,
          originalPath,
          mediaFile
        });

        sendUpdate({
          type: 'item_update',
          originalPath,
          migrated: true,
          mediaFileId: mediaFile.id
        });

      } catch (error) {
        console.error(`Failed to migrate ${originalPath}:`, error);
        sendUpdate({
          type: 'item_update',
          originalPath,
          migrated: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      processedCount++;
    }

    // Update site settings and profile
    sendUpdate({ 
      type: 'progress', 
      progress: 95,
      message: 'Updating site settings and profile...'
    });

    // Update site settings to use the logo from media library
    const logoFile = migratedFiles.find(f => f.category === 'branding' && f.mediaFile.filename.includes('.png'));
    if (logoFile) {
      await query(
        `INSERT INTO site_settings (setting_key, setting_value, updated_at)
         VALUES ('logoUrl', $1, NOW())
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = $1, updated_at = NOW()`,
        [logoFile.mediaFile.file_path]
      );
      sendUpdate({ type: 'progress', progress: 97, message: 'Updated site logo settings' });
    }

    // Update profile with one of the profile images
    const profileFile = migratedFiles.find(f => f.category === 'profile');
    if (profileFile) {
      await query(
        `UPDATE profiles 
         SET image_url = $1, updated_at = NOW()
         WHERE id = (SELECT id FROM profiles LIMIT 1)`,
        [profileFile.mediaFile.file_path]
      );
      sendUpdate({ type: 'progress', progress: 99, message: 'Updated profile image' });
    }

    sendUpdate({ 
      type: 'complete', 
      progress: 100,
      message: 'Migration completed successfully!',
      migratedFiles
    });

  } catch (error) {
    console.error('Migration failed:', error);
    sendUpdate({
      type: 'error',
      message: error instanceof Error ? error.message : 'Migration failed'
    });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if any images have been migrated already
    const result = await query(
      `SELECT id, filename, original_name, file_path, alt_text 
       FROM media_files 
       WHERE (alt_text ILIKE '%slideshow%' OR alt_text ILIKE '%logo%' OR alt_text ILIKE '%profile%')
       ORDER BY created_at DESC`
    );

    const migratedItems = result.rows.map(row => ({
      category: row.alt_text?.includes('slideshow') ? 'slideshow' : 
                row.alt_text?.includes('logo') ? 'logo' : 
                row.alt_text?.includes('profile') ? 'profile' : 'unknown',
      originalPath: `migrated-${row.original_name}`,
      description: row.alt_text || row.original_name,
      migrated: true,
      mediaFileId: row.id
    }));

    return NextResponse.json({
      migrated: migratedItems.length > 0,
      completed: migratedItems.length >= 9, // Total expected items
      items: migratedItems
    });

  } catch (error) {
    console.error('Error checking migration status:', error);
    return NextResponse.json({ error: 'Failed to check migration status' }, { status: 500 });
  }
} 