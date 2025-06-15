import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect, { isMockMode } from '@/lib/db';
import Post from '@/lib/models/Post';
import Project from '@/lib/models/Project';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    if (isMockMode()) {
      // Return mock content items with lastModified field
      const mockContentItems = [
        {
          id: '1',
          title: 'Getting Started with Next.js 14',
          slug: 'getting-started-nextjs-14',
          type: 'post',
          status: 'published',
          publishedAt: '2024-01-15T10:00:00Z',
          lastModified: '2024-01-15T15:30:00Z',
          tags: ['Next.js', 'React', 'JavaScript'],
          author: 'Admin User'
        },
        {
          id: '2',
          title: 'Advanced TypeScript Patterns',
          slug: 'advanced-typescript-patterns',
          type: 'post',
          status: 'draft',
          lastModified: '2024-01-14T16:45:00Z',
          tags: ['TypeScript', 'Patterns', 'Development'],
          author: 'Admin User'
        },
        {
          id: '3',
          title: 'E-commerce Platform',
          slug: 'ecommerce-platform',
          type: 'project',
          status: 'published',
          publishedAt: '2024-01-10T14:30:00Z',
          lastModified: '2024-01-10T14:30:00Z',
          tags: ['React', 'Node.js', 'MongoDB'],
          author: 'Admin User'
        },
        {
          id: '4',
          title: 'Portfolio Website',
          slug: 'portfolio-website',
          type: 'project',
          status: 'published',
          publishedAt: '2024-01-05T09:15:00Z',
          lastModified: '2024-01-05T09:15:00Z',
          tags: ['Next.js', 'Tailwind CSS'],
          author: 'Admin User'
        },
        {
          id: '5',
          title: 'About Page',
          slug: 'about',
          type: 'page',
          status: 'published',
          publishedAt: '2024-01-01T12:00:00Z',
          lastModified: '2024-01-01T12:00:00Z',
          tags: [],
          author: 'Admin User'
        }
      ];

      return NextResponse.json(mockContentItems);
    }

    // Get all posts and projects
    const [posts, projects] = await Promise.all([
      Post.find({}).select('title slug published date tags updatedAt'),
      Project.find({}).select('title slug featured technologies createdAt')
    ]);

    const contentItems = [
      ...posts.map(post => ({
        id: (post._id as any).toString(),
        title: post.title,
        slug: post.slug,
        type: 'post',
        status: post.published ? 'published' : 'draft',
        publishedAt: post.published ? post.date : null,
        lastModified: post.updatedAt || new Date().toISOString(),
        tags: post.tags || [],
        author: 'Admin User'
      })),
      ...projects.map(project => ({
        id: (project._id as any).toString(),
        title: project.title,
        slug: project.slug,
        type: 'project',
        status: 'published', // Projects don't have published field, assume all are published
        publishedAt: project.createdAt,
        lastModified: project.createdAt || new Date().toISOString(),
        tags: project.technologies || [],
        author: 'Admin User'
      }))
    ];

    return NextResponse.json(contentItems);

  } catch (error) {
    console.error('Content items API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content items' },
      { status: 500 }
    );
  }
} 

