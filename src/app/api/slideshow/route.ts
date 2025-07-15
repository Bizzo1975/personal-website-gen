import { NextResponse } from 'next/server';
import { SlideshowService } from '@/lib/services/slideshow-service';

export async function GET() {
  try {
    const images = await SlideshowService.getSlideshowImages();
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching slideshow images:', error);
    return NextResponse.json({ error: 'Failed to fetch slideshow images' }, { status: 500 });
  }
} 