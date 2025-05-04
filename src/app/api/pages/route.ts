import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllPages, createPage } from '@/lib/services/page-service';

// GET: Fetch all pages
export async function GET(request: NextRequest) {
  try {
    const pages = await getAllPages();
    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error in GET /api/pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' }, 
      { status: 500 }
    );
  }
}

// POST: Create a new page
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, title, slug, content, metaDescription } = body;
    
    // Validate required fields
    if (!name || !title || !slug || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Check if slug is unique (additional validation)
    
    // Create the page
    const newPage = await createPage({
      name,
      title,
      slug,
      content,
      metaDescription: metaDescription || '',
    });
    
    if (!newPage) {
      return NextResponse.json(
        { error: 'Failed to create page' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Page created successfully',
      page: newPage 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/pages:', error);
    return NextResponse.json(
      { error: 'Failed to create page' }, 
      { status: 500 }
    );
  }
} 