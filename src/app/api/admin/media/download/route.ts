import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import archiver from 'archiver';
import { Readable } from 'stream';

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

    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Create a readable stream from the archive
    const chunks: Buffer[] = [];
    
    archive.on('data', (chunk) => {
      chunks.push(chunk);
    });

    archive.on('error', (err) => {
      throw err;
    });

    // For demo purposes, we'll create a simple text file for each selected item
    // In a real app, you would fetch the actual files from storage
    for (const itemId of itemIds) {
      const fileName = `media-item-${itemId}.txt`;
      const content = `This is a placeholder for media item ${itemId}\nGenerated on: ${new Date().toISOString()}`;
      archive.append(content, { name: fileName });
    }

    // Finalize the archive
    await archive.finalize();

    // Wait for all chunks to be collected
    await new Promise((resolve) => {
      archive.on('end', resolve);
    });

    // Combine all chunks into a single buffer
    const zipBuffer = Buffer.concat(chunks);

    // Return the zip file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="media-export-${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error creating media download:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
} 

