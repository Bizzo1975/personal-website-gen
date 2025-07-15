import { NextResponse } from 'next/server';
import { SlideshowService } from '@/lib/services/slideshow-service';

export async function POST(request: Request) {
  try {
    const { mediaFileId } = await request.json();
    
    if (!mediaFileId) {
      return NextResponse.json({ error: 'Media file ID is required' }, { status: 400 });
    }

    await SlideshowService.addToSlideshow(mediaFileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding image to slideshow:', error);
    return NextResponse.json({ error: 'Failed to add image to slideshow' }, { status: 500 });
  }
} 