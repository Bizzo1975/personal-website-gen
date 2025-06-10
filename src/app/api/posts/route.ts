import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';

// Mock posts data store (replace with actual database in production)
let mockPosts = [
  {
    id: '1',
    title: 'Getting Started with Next.js and TypeScript',
    slug: 'getting-started-with-nextjs-typescript',
    content: '# Getting Started with Next.js and TypeScript\n\nNext.js 13+ with TypeScript provides an excellent development experience with type safety and modern React features...',
    excerpt: 'Learn how to set up your first Next.js project with TypeScript and build modern applications with type safety.',
    featuredImage: '/images/blog/nextjs-typescript.svg',
    tags: ['Next.js', 'TypeScript', 'React', 'Web Development'],
    published: true,
    publishedAt: '2023-05-15T10:00:00Z',
    createdAt: '2023-05-10T08:30:00Z',
    updatedAt: '2023-05-15T09:45:00Z',
    metaDescription: 'A comprehensive guide to getting started with Next.js and TypeScript for modern web development.',
  },
  {
    id: '2',
    title: 'Why I Switched to Tailwind CSS',
    slug: 'why-i-switched-to-tailwind-css',
    content: '# Why I Switched to Tailwind CSS\n\nTailwind CSS has revolutionized my development workflow with its utility-first approach...',
    excerpt: 'Discover why Tailwind CSS has revolutionized my development workflow and how it can improve your styling approach.',
    featuredImage: '/images/blog/tailwind-css.svg',
    tags: ['CSS', 'Tailwind', 'Design', 'Development'],
    published: true,
    publishedAt: '2023-04-20T14:30:00Z',
    createdAt: '2023-04-15T11:20:00Z',
    updatedAt: '2023-04-20T13:15:00Z',
    metaDescription: 'Learn why Tailwind CSS is becoming the go-to choice for modern web development.',
  },
  {
    id: '3',
    title: 'React Best Practices for 2024',
    slug: 'react-best-practices-2024',
    content: '# React Best Practices for 2024\n\nAs React continues to evolve, staying up-to-date with best practices is crucial for building maintainable applications...',
    excerpt: 'Learn the latest React best practices, performance optimizations, and clean code techniques for modern development.',
    featuredImage: '/images/blog/react-best-practices.svg',
    tags: ['React', 'Performance', 'Best Practices', 'JavaScript'],
    published: false,
    createdAt: '2023-06-05T09:40:00Z',
    updatedAt: '2023-06-07T16:25:00Z',
    metaDescription: 'Essential React best practices for building high-quality applications in 2024.',
  },
  {
    id: '4',
    title: 'Modern Web Development Techniques',
    slug: 'modern-web-development-techniques',
    content: '# Modern Web Development Techniques\n\nThe web development landscape is constantly evolving with new tools, techniques, and methodologies...',
    excerpt: 'Explore cutting-edge web development techniques, tools, and methodologies that are shaping the future of the web.',
    featuredImage: '/images/blog/web-development.svg',
    tags: ['Web Development', 'Performance', 'Tools', 'Architecture'],
    published: true,
    publishedAt: '2023-03-10T12:00:00Z',
    createdAt: '2023-02-28T15:30:00Z',
    updatedAt: '2023-03-10T11:45:00Z',
    metaDescription: 'Practical techniques and tools for modern web development and architecture.',
  }
];

// GET /api/posts - Get all posts
export async function GET() {
  try {
    // In a real application, fetch from database
    return NextResponse.json(mockPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const postData = await request.json();
    
    // Validate required fields
    if (!postData.title || !postData.slug || !postData.content || !postData.excerpt) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content, and excerpt are required' },
        { status: 400 }
      );
    }
    
    // Check for duplicate slug
    const slugExists = mockPosts.some(post => post.slug === postData.slug);
    if (slugExists) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    
    // Create new post
    const newPost = {
      id: Date.now().toString(),
      ...postData,
      tags: postData.tags || [],
      published: Boolean(postData.published),
      createdAt: now,
      updatedAt: now,
      publishedAt: postData.published ? now : null,
    };
    
    // In a real app, save to database
    mockPosts.push(newPost);
    
    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');
    
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 