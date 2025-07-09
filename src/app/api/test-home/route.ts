import { NextResponse } from 'next/server';
import { getPageBySlug } from '@/lib/services/page-service';
import { serializeMarkdown } from '@/lib/mdx';

export async function GET() {
  try {
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
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
} 