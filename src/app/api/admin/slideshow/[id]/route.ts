import { NextResponse } from 'next/server';
import { SlideshowService } from '@/lib/services/slideshow-service';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    await SlideshowService.removeFromSlideshow(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing image from slideshow:', error);
    return NextResponse.json({ error: 'Failed to remove image from slideshow' }, { status: 500 });
  }
} 