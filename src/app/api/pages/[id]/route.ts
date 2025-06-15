import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';
import { getServerSession } from 'next-auth/next';
import { getPageById, updatePage, deletePage } from '@/lib/services/page-service';

// GET: Fetch a specific page by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`🔍 API: Getting page by ID: ${id}`);
    
    const page = await getPageById(id);
    
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error in GET /api/pages/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' }, 
      { status: 500 }
    );
  }
}

// PUT: Update an existing page
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
    
    const id = params.id;
    console.log(`✏️ API: Updating page with ID: ${id}`);
    
    // First check if the page exists
    const existingPage = await getPageById(id);
    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' }, 
        { status: 404 }
      );
    }

    // Get the request body
    const body = await request.json();
    console.log('📄 Request body for update:', JSON.stringify({
      id, 
      title: body.title,
      headerTitle: body.headerTitle,
      headerSubtitle: body.headerSubtitle?.substring(0, 30) + '...'
    }));
    
    // For essential pages, keep the slug the same
    const isEssentialPage = ['home', 'about', 'blog', 'projects', 'contact'].includes(existingPage.slug);
    
    // Fields that can be updated
    const updateData: any = {
      name: body.name,
      title: body.title,
      content: body.content,
      metaDescription: body.metaDescription || existingPage.metaDescription,
      headerTitle: body.headerTitle || body.title || existingPage.headerTitle,
      headerSubtitle: body.headerSubtitle || existingPage.headerSubtitle,
      heroHeading: body.heroHeading || existingPage.heroHeading
    };
    
    // Only update slug if it's not an essential page and slug is provided
    if (!isEssentialPage && body.slug) {
      updateData.slug = body.slug;
    }
    
    // Special handling for contact page to ensure header fields are always set
    if (existingPage.slug === 'contact') {
      console.log('💡 Special handling for contact page');
      if (!updateData.headerTitle) {
        updateData.headerTitle = 'Contact Me';
      }
      if (!updateData.headerSubtitle) {
        updateData.headerSubtitle = 'Have a question or want to work together? Get in touch with me using the form below or through any of my social channels.';
      }
    }
    
    // Update the page
    const updatedPage = await updatePage(id, updateData);
    
    if (!updatedPage) {
      return NextResponse.json(
        { error: 'Failed to update page' }, 
        { status: 500 }
      );
    }
    
    console.log(`✅ Page updated successfully: ${id}`);
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
    
    const id = params.id;
    console.log(`🗑️ API: Deleting page with ID: ${id}`);
    
    // Check if page exists before deletion
    const existingPage = await getPageById(id);
    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' }, 
        { status: 404 }
      );
    }
    
    // Don't allow deletion of essential pages
    if (['home', 'about', 'blog', 'projects', 'contact'].includes(existingPage.slug)) {
      return NextResponse.json(
        { error: 'Cannot delete essential page' }, 
        { status: 400 }
      );
    }
    
    const success = await deletePage(id);
    
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