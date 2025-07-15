import { NextResponse } from 'next/server';
import { SlideshowService } from '@/lib/services/slideshow-service';

export async function GET() {
  try {
    const settings = await SlideshowService.getSlideshowSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching slideshow settings:', error);
    return NextResponse.json({ error: 'Failed to fetch slideshow settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const settings = await request.json();
    await SlideshowService.updateSlideshowSettings(settings);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating slideshow settings:', error);
    return NextResponse.json({ error: 'Failed to update slideshow settings' }, { status: 500 });
  }
} 