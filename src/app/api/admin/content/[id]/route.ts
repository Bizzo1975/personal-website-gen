import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const contentId = resolvedParams.id;
    
    // Mock content data - in real app, fetch from database
    const mockContent = {
      id: contentId,
      title: 'Building Modern Web Applications with Next.js',
      content: `# Building Modern Web Applications with Next.js

## Introduction

Next.js has revolutionized the way we build React applications by providing a comprehensive framework that handles many of the complexities of modern web development.

## Key Features

### Server-Side Rendering (SSR)
Next.js provides built-in SSR capabilities that improve performance and SEO.

### Static Site Generation (SSG)
Generate static pages at build time for optimal performance.

### API Routes
Build full-stack applications with built-in API routes.

## Getting Started

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## Best Practices

1. Use TypeScript for better development experience
2. Implement proper error boundaries
3. Optimize images with next/image
4. Use dynamic imports for code splitting

## Conclusion

Next.js continues to be an excellent choice for modern web development, offering powerful features while maintaining developer experience.`,
      excerpt: 'Learn how to build modern web applications using Next.js with best practices and real-world examples.',
      type: 'post',
      status: 'draft',
      tags: ['Next.js', 'React', 'Web Development', 'JavaScript'],
      author: session.user.name || 'Admin User',
      lastModified: new Date().toISOString(),
      collaborators: ['editor@example.com'],
      template: 'technical-blog-post'
    };

    return NextResponse.json(mockContent);

  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const contentId = resolvedParams.id;
    const updateData = await request.json();

    // In a real app, you would:
    // 1. Validate the update data
    // 2. Update the content in the database
    // 3. Create a new version record
    // 4. Update search indexes if needed

    console.log(`Updating content ${contentId}:`, updateData);

    // Simulate successful update
    const updatedContent = {
      id: contentId,
      ...updateData,
      lastModified: new Date().toISOString(),
      author: session.user.name || 'Admin User'
    };

    return NextResponse.json({
      success: true,
      message: 'Content updated successfully',
      content: updatedContent
    });

  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const contentId = resolvedParams.id;

    // In a real app, you would:
    // 1. Check if user has permission to delete
    // 2. Soft delete or hard delete based on policy
    // 3. Clean up related data (comments, versions, etc.)
    // 4. Update search indexes

    console.log(`Deleting content ${contentId}`);

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
} 