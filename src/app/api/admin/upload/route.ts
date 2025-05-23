import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Handle image uploads for the rich text editor
 */
export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replace(/\s+/g, '-').toLowerCase();
    const ext = path.extname(filename);
    const uniqueFilename = `${uuidv4()}${ext}`;
    
    // Determine the directory based on the upload type
    let uploadDir = '';
    if (type === 'logo') {
      uploadDir = path.join(process.cwd(), 'public', 'images');
    } else if (type === 'project') {
      uploadDir = path.join(process.cwd(), 'public', 'images', 'projects');
    } else if (type === 'profile') {
      uploadDir = path.join(process.cwd(), 'public', 'images', 'profiles');
    } else if (type === 'slideshow') {
      uploadDir = path.join(process.cwd(), 'public', 'images', 'slideshow');
    } else {
      uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    }
    
    // Create the file path
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Write the file to the filesystem
    await writeFile(filePath, buffer);
    
    // Construct the URL path
    let urlPath = '';
    if (type === 'logo') {
      urlPath = `/images/${uniqueFilename}`;
    } else if (type === 'project') {
      urlPath = `/images/projects/${uniqueFilename}`;
    } else if (type === 'profile') {
      urlPath = `/images/profiles/${uniqueFilename}`;
    } else if (type === 'slideshow') {
      urlPath = `/images/slideshow/${uniqueFilename}`;
    } else {
      urlPath = `/uploads/images/${uniqueFilename}`;
    }
    
    return NextResponse.json({ 
      success: true,
      filename: uniqueFilename,
      path: urlPath
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
