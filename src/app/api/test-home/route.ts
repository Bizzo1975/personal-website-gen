import { NextResponse } from 'next/server';
import { getPageBySlug } from '@/lib/services/page-service';
import { serializeMarkdown } from '@/lib/mdx';

export async function GET() {
  try {
    // Security: Disable test routes in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'Test endpoints are disabled in production',
        message: 'This endpoint is only available in development mode'
      }, { status: 403 });
    }

    console.log('Test endpoint: Loading home page...');
    
    const homePage = await getPageBySlug('home');
    
    if (!homePage) {
      return NextResponse.json({ error: 'Home page not found' }, { status: 404 });
    }
    
    console.log('Test endpoint: Home page loaded, content length:', homePage.content.length);
    
    // Try to serialize the content
    console.log('Test endpoint: Serializing content...');
    const serialized = await serializeMarkdown(homePage.content);
    
    console.log('Test endpoint: Content serialized successfully');
    
    return NextResponse.json({ 
      success: true, 
      hasContent: !!serialized,
      contentLength: homePage.content.length,
      heroHeading: homePage.heroHeading
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({
      error: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
} 