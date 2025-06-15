import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import fs from 'fs/promises';
import path from 'path';

// Mock media data - in a real app, this would come from a database
const mockMediaItems = [
  {
    id: '1',
    name: 'hero-image.jpg',
    type: 'image' as const,
    size: 2048576,
    url: '/images/slideshow/slide1.jpg',
    thumbnail: '/images/slideshow/slide1.jpg',
    uploadedAt: '2024-01-15T10:30:00Z',
    folder: 'slideshow'
  },
  {
    id: '2',
    name: 'project-screenshot.png',
    type: 'image' as const,
    size: 1536000,
    url: '/images/projects/ecommerce-platform.svg',
    thumbnail: '/images/projects/ecommerce-platform.svg',
    uploadedAt: '2024-01-14T15:45:00Z',
    folder: 'projects'
  },
  {
    id: '3',
    name: 'blog-featured.jpg',
    type: 'image' as const,
    size: 1024000,
    url: '/images/blog/featured-post.jpg',
    thumbnail: '/images/blog/featured-post.jpg',
    uploadedAt: '2024-01-13T09:20:00Z',
    folder: 'blog'
  },
  {
    id: '4',
    name: 'demo-video.mp4',
    type: 'video' as const,
    size: 15728640,
    url: '/videos/demo.mp4',
    thumbnail: '/images/video-thumbnail.jpg',
    uploadedAt: '2024-01-12T14:10:00Z',
    folder: 'videos'
  },
  {
    id: '5',
    name: 'documentation.pdf',
    type: 'document' as const,
    size: 512000,
    url: '/documents/guide.pdf',
    uploadedAt: '2024-01-11T11:00:00Z',
    folder: 'documents'
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, you would fetch from database
    // For now, return mock data
    return NextResponse.json(mockMediaItems);
  } catch (error) {
    console.error('Error fetching media items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folder = formData.get('folder') as string || '';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedItems = [];

    for (const file of files) {
      if (file.size === 0) continue;

      // Determine file type
      let fileType: 'image' | 'video' | 'document' = 'document';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      }

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder || 'general');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = path.extname(file.name);
      const baseName = path.basename(file.name, extension);
      const fileName = `${baseName}-${timestamp}${extension}`;
      const filePath = path.join(uploadDir, fileName);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filePath, buffer);

      // Create media item
      const mediaItem = {
        id: `upload-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: fileType,
        size: file.size,
        url: `/uploads/${folder || 'general'}/${fileName}`,
        thumbnail: fileType === 'image' ? `/uploads/${folder || 'general'}/${fileName}` : undefined,
        uploadedAt: new Date().toISOString(),
        folder: folder || undefined
      };

      uploadedItems.push(mediaItem);
    }

    return NextResponse.json({ 
      success: true, 
      items: uploadedItems,
      message: `Successfully uploaded ${uploadedItems.length} file(s)`
    });

  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
} 

