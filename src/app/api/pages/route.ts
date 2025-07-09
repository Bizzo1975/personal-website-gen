import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { getPageBySlug, getAllPages, createPage } from '@/lib/services/page-service';

// Default pages for fallback
const DEFAULT_PAGES = {
  home: {
    id: 'home',
    title: 'Home',
    slug: 'home',
    content: 'Welcome to my personal website. I\'m a developer passionate about creating amazing web experiences.',
    metaTitle: 'Home - Personal Website',
    metaDescription: 'Welcome to my personal website showcasing my projects, blog posts, and professional experience.',
    status: 'published' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  about: {
    id: 'about',
    title: 'About Me',
    slug: 'about',
    content: 'I\'m a passionate developer with experience in modern web technologies including React, Next.js, and TypeScript.',
    metaTitle: 'About - Personal Website',
    metaDescription: 'Learn more about my background, experience, and the technologies I work with.',
    status: 'published' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// GET: Fetch all pages or a specific page by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      // Get specific page by slug
      try {
        const page = await getPageBySlug(slug);
        if (page) {
          return NextResponse.json(page);
        }
      } catch (error) {
        console.error('Error fetching page:', error);
      }

      // Fallback to default pages
      if (DEFAULT_PAGES[slug as keyof typeof DEFAULT_PAGES]) {
        return NextResponse.json(DEFAULT_PAGES[slug as keyof typeof DEFAULT_PAGES]);
      }

      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    } else {
      // Get all pages
      try {
        const pages = await getAllPages();
        return NextResponse.json(pages);
      } catch (error) {
        console.error('Error fetching pages:', error);
        // Return default pages as fallback
        return NextResponse.json(Object.values(DEFAULT_PAGES));
      }
    }
  } catch (error) {
    console.error('Pages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { 
      name, 
      title, 
      slug, 
      content, 
      metaDescription, 
      headerTitle, 
      headerSubtitle, 
      heroHeading,
      connectSectionTitle,
      connectSectionContent,
      formSectionTitle,
      formDescription
    } = body;
    
    // Validate required fields - content is optional for contact pages
    if (!name || !title || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // For non-contact pages, require content
    if (slug !== 'contact' && !content) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Create the page
    const newPage = await createPage({
      name,
      title,
      slug,
      content: content || '',
      metaDescription: metaDescription || '',
      headerTitle: headerTitle || title,
      headerSubtitle: headerSubtitle || '',
      heroHeading: heroHeading || 'Building the Modern Web',
      connectSectionTitle: connectSectionTitle || undefined,
      connectSectionContent: connectSectionContent || undefined,
      formSectionTitle: formSectionTitle || undefined,
      formDescription: formDescription || undefined,
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
