import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';

// Mock posts data store (this should match the one in the main posts route)
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
    permissions: {
      level: 'all',
      allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: false,
      customRules: []
    }
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
    permissions: {
      level: 'professional',
      allowedRoles: ['admin', 'editor', 'author'],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: true,
      customRules: []
    }
  }
];

// GET /api/posts/[id] - Get a specific post
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const post = mockPosts.find(p => p.id === params.id);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Update a specific post
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

    const postData = await request.json();
    const postIndex = mockPosts.findIndex(p => p.id === params.id);
    
    if (postIndex === -1) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!postData.title || !postData.slug || !postData.content || !postData.excerpt) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content, and excerpt are required' },
        { status: 400 }
      );
    }

    // Check for duplicate slug (excluding current post)
    const slugExists = mockPosts.some(post => post.slug === postData.slug && post.id !== params.id);
    if (slugExists) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }

    // Update the post
    const updatedPost = {
      ...mockPosts[postIndex],
      ...postData,
      id: params.id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
      publishedAt: postData.published && !mockPosts[postIndex].published 
        ? new Date().toISOString() 
        : mockPosts[postIndex].publishedAt
    };

    mockPosts[postIndex] = updatedPost;

    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');
    revalidatePath(`/blog/${updatedPost.slug}`);

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a specific post
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

    const postIndex = mockPosts.findIndex(p => p.id === params.id);
    
    if (postIndex === -1) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const deletedPost = mockPosts[postIndex];
    mockPosts.splice(postIndex, 1);

    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');

    return NextResponse.json({ message: 'Post deleted successfully', post: deletedPost });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
} 