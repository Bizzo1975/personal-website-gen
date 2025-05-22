import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';

// Import the mockPosts data (in a real app, this would be a database call)
// Note: In a real application, this would be a database import
// This is temporary for this demo
let mockPosts = [
  {
    id: '1',
    title: 'Getting Started with Next.js 13',
    slug: 'getting-started-with-nextjs-13',
    content: '# Getting Started with Next.js 13\n\nNext.js 13 introduces a new App Router built on React Server Components...',
    excerpt: 'Learn how to set up your first Next.js 13 project with the new App Router and React Server Components.',
    featuredImage: 'https://images.unsplash.com/photo-1551650975-87deedd944c3',
    tags: ['Next.js', 'React', 'Web Development'],
    published: true,
    publishedAt: '2023-05-15T10:00:00Z',
    createdAt: '2023-05-10T08:30:00Z',
    updatedAt: '2023-05-15T09:45:00Z',
    metaDescription: 'A comprehensive guide to getting started with Next.js 13 and its new features.',
  },
  {
    id: '2',
    title: 'Advanced TypeScript Patterns',
    slug: 'advanced-typescript-patterns',
    content: '# Advanced TypeScript Patterns\n\nIn this post, we\'ll explore advanced TypeScript patterns...',
    excerpt: 'Discover powerful TypeScript patterns and techniques to improve your code quality and developer experience.',
    featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    tags: ['TypeScript', 'JavaScript', 'Programming'],
    published: true,
    publishedAt: '2023-04-20T14:30:00Z',
    createdAt: '2023-04-15T11:20:00Z',
    updatedAt: '2023-04-20T13:15:00Z',
    metaDescription: 'Learn advanced TypeScript patterns to level up your development skills.',
  },
  {
    id: '3',
    title: 'Building a Custom React Hook',
    slug: 'building-a-custom-react-hook',
    content: '# Building a Custom React Hook\n\nReact Hooks are a powerful way to reuse stateful logic...',
    excerpt: 'Learn how to create your own custom React hooks to share logic between components.',
    featuredImage: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2',
    tags: ['React', 'JavaScript', 'Hooks'],
    published: false,
    createdAt: '2023-06-05T09:40:00Z',
    updatedAt: '2023-06-07T16:25:00Z',
    metaDescription: 'A step-by-step guide to creating custom React hooks for reusable logic.',
  },
  {
    id: '4',
    title: 'Optimizing Website Performance',
    slug: 'optimizing-website-performance',
    content: '# Optimizing Website Performance\n\nIn this comprehensive guide, we\'ll cover various techniques...',
    excerpt: 'Learn how to measure and improve your website\'s performance for better user experience and SEO.',
    featuredImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
    tags: ['Performance', 'Web Development', 'SEO'],
    published: true,
    publishedAt: '2023-03-10T12:00:00Z',
    createdAt: '2023-02-28T15:30:00Z',
    updatedAt: '2023-03-10T11:45:00Z',
    metaDescription: 'Practical techniques for optimizing your website\'s performance and improving user experience.',
  },
  {
    id: '5',
    title: 'Introduction to TailwindCSS',
    slug: 'introduction-to-tailwindcss',
    content: '# Introduction to TailwindCSS\n\nTailwindCSS is a utility-first CSS framework...',
    excerpt: 'Discover how TailwindCSS can streamline your styling workflow with its utility-first approach.',
    featuredImage: 'https://images.unsplash.com/photo-1618788372246-79faff0c3742',
    tags: ['CSS', 'TailwindCSS', 'Web Design'],
    published: true,
    publishedAt: '2023-01-25T08:15:00Z',
    createdAt: '2023-01-20T14:20:00Z',
    updatedAt: '2023-01-25T07:30:00Z',
    metaDescription: 'Learn the basics of TailwindCSS and how it can improve your development workflow.',
  }
];

// GET /api/posts/[id] - Get a single post
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Find the post by ID
    const post = mockPosts.find(p => p.id === id);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Update a post
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const updatedData = await request.json();
    
    // Find the post index
    const postIndex = mockPosts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Check if updating slug and if it already exists
    if (
      updatedData.slug && 
      updatedData.slug !== mockPosts[postIndex].slug &&
      mockPosts.some(p => p.id !== id && p.slug === updatedData.slug)
    ) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    
    // Check if publishing status changed
    const wasPublished = mockPosts[postIndex].published;
    const isNowPublished = updatedData.published !== undefined 
      ? Boolean(updatedData.published) 
      : wasPublished;
    
    // Update the post
    mockPosts[postIndex] = {
      ...mockPosts[postIndex],
      ...updatedData,
      tags: updatedData.tags || mockPosts[postIndex].tags,
      published: isNowPublished,
      updatedAt: now,
      // Update publishedAt if post is being published for the first time
      publishedAt: (!wasPublished && isNowPublished) 
        ? now 
        : mockPosts[postIndex].publishedAt
    };
    
    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');
    revalidatePath(`/blog/${mockPosts[postIndex].slug}`);
    
    return NextResponse.json(mockPosts[postIndex]);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Find the post
    const postIndex = mockPosts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Store slug for revalidation
    const slug = mockPosts[postIndex].slug;
    
    // Remove the post
    mockPosts = mockPosts.filter(p => p.id !== id);
    
    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');
    revalidatePath(`/blog/${slug}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
} 