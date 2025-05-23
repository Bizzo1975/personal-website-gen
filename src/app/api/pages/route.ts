import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllPages, createPage, getPageBySlug } from '@/lib/services/page-service';
import { isMockMode } from '@/lib/db';

// Default values for pages when not found in mock mode
const DEFAULT_PAGES = {
  'blog': {
    name: 'Blog Page',
    title: 'Blog',
    slug: 'blog',
    content: '# My Blog\n\nWelcome to my blog.',
    metaDescription: 'My development blog',
    headerTitle: 'Blog & Articles',
    headerSubtitle: 'Thoughts, tutorials, and insights on web development, design, and technology.',
    heroHeading: '',
  },
  'projects': {
    name: 'Projects Page',
    title: 'My Projects',
    slug: 'projects',
    content: '# My Projects\n\nShowcase of my work.',
    metaDescription: 'My portfolio of projects',
    headerTitle: 'Projects & Portfolio',
    headerSubtitle: 'Explore my latest work and personal projects. Each project represents my passion for creating elegant solutions to complex problems.',
    heroHeading: '',
  },
  'contact': {
    name: 'Contact Page',
    title: 'Contact Me',
    slug: 'contact',
    content: '# Contact Me\n\nGet in touch.',
    metaDescription: 'Contact information',
    headerTitle: 'Contact Me',
    headerSubtitle: 'Have a question or want to work together? Get in touch with me using the form below or through any of my social channels.',
    heroHeading: '',
  },
  'about': {
    name: 'About Page',
    title: 'About Me',
    slug: 'about',
    content: '# About Me\n\nMy story and background.',
    metaDescription: 'About me and my background',
    headerTitle: 'About Me',
    headerSubtitle: 'Learn more about my background, skills, and experience in web development.',
    heroHeading: '',
  },
};

// GET: Fetch all pages or a specific page by slug
export async function GET(request: NextRequest) {
  try {
    // Check if slug query parameter is provided
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    if (slug) {
      // If slug is provided, return the specific page
      console.log(`🔍 API: Getting page by slug: ${slug}`);
      const page = await getPageBySlug(slug);
      
      if (!page) {
        // In mock mode, provide default values for common pages
        if (isMockMode() && DEFAULT_PAGES[slug as keyof typeof DEFAULT_PAGES]) {
          console.log(`⚠️ Page "${slug}" not found in database, using default values in mock mode`);
          const defaultPage = DEFAULT_PAGES[slug as keyof typeof DEFAULT_PAGES];
          const mockPage = {
            _id: `mock-${Date.now()}`,
            ...defaultPage,
            updatedAt: new Date()
          };
          
          return NextResponse.json({ page: mockPage });
        }
        
        return NextResponse.json(
          { error: 'Page not found', slug }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json({ page });
    } else {
      // Otherwise, return all pages
      console.log('📚 API: Getting all pages');
      const pages = await getAllPages();
      return NextResponse.json(pages);
    }
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
    const { name, title, slug, content, metaDescription, headerTitle, headerSubtitle, heroHeading } = body;
    
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
      headerTitle: headerTitle || title,
      headerSubtitle: headerSubtitle || '',
      heroHeading: heroHeading || 'Building the Modern Web',
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