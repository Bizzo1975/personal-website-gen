import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { MediaService } from '@/lib/services/media-service';

/**
 * Bulk Upload API Route
 * POST: Upload multiple files at once
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folder = formData.get('folder') as string || null;
    const contentType = formData.get('contentType') as string || 'general';
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Get the user's ID from the database
    const userQuery = await query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userQuery.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userQuery.rows[0].id;

    console.log('📁 Bulk uploading files:', {
      fileCount: files.length,
      folder,
      contentType,
      userId
    });

    const uploadResults: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          errors.push(`${file.name}: File too large (max 10MB)`);
          continue;
        }

        // Validate file type
        const allowedTypes = ['image/', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.some(type => file.type.startsWith(type))) {
          errors.push(`${file.name}: Unsupported file type`);
          continue;
        }

        const uploadResult = await MediaService.uploadFile(file, {
          contentType: contentType as 'post' | 'project' | 'newsletter' | 'general',
          altText: '',
          uploadedBy: userId,
          folder
        });

        uploadResults.push(uploadResult);

      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${file.name}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      successful: uploadResults.length,
      total: files.length,
      files: uploadResults,
      errors
    });

  } catch (error) {
    console.error('❌ Bulk upload error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to upload files',
      details: errorMessage,
      successful: 0,
      total: 0,
      files: [],
      errors: [errorMessage]
    }, { status: 500 });
  }
} 