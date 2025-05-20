import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPageById, updatePage, deletePage } from '@/lib/services/page-service';

// GET: Fetch a single page by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const page = await getPageById(params.id);
    
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(page);
  } catch (error) {
    console.error('Error in GET /api/pages/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' }, 
      { status: 500 }
    );
  }
}

// PUT: Update a page
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!name || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Don't allow changing the slug for essential pages (home and about)
    const currentPage = await getPageById(params.id);
    if (!currentPage) {
      return NextResponse.json(
        { error: 'Page not found' }, 
        { status: 404 }
      );
    }
    
    const isEssentialPage = ['home', 'about'].includes(currentPage.slug);
    const updatedSlug = isEssentialPage ? currentPage.slug : slug;
    
    // Update the page
    const updatedPage = await updatePage(params.id, {
      name,
      title,
      slug: updatedSlug,
      content,
      metaDescription: metaDescription || '',
    });
    
    if (!updatedPage) {
      console.error(`Failed to update page ${params.id}. Check server logs for details.`);
      return NextResponse.json(
        { error: 'Failed to update page. This could be because the page was not found or there was a database error.' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Page updated successfully',
      page: updatedPage 
    });
  } catch (error) {
    console.error('Error in PUT /api/pages/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update page' }, 
      { status: 500 }
    );
  }
}

// DELETE: Delete a page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Check if it's an essential page (don't allow deletion)
    const page = await getPageById(params.id);
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' }, 
        { status: 404 }
      );
    }
    
    if (['home', 'about'].includes(page.slug)) {
      return NextResponse.json(
        { error: 'Cannot delete essential pages' }, 
        { status: 403 }
      );
    }
    
    // Delete the page
    const success = await deletePage(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete page' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Page deleted successfully' 
    });
  } catch (error) {
    console.error('Error in DELETE /api/pages/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' }, 
      { status: 500 }
    );
  }
} 