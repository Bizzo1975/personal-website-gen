import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';
import { ProjectService } from '@/lib/services/project-service';

// GET /api/admin/content-items - Get all content items (posts and projects)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get all posts and projects
    const [posts, projects] = await Promise.all([
      PostService.getAllPostsForAdmin(),
      ProjectService.getAllProjectsForAdmin()
    ]);

    // Convert to content management format
    const contentItems = [
      ...posts.map(post => ({
        id: post.id,
        title: post.title,
        type: 'post' as const,
        author: post.author,
        lastModified: post.updatedAt?.toISOString() || post.createdAt?.toISOString() || new Date().toISOString(),
        status: post.published ? 'published' as const : 'draft' as const,
        collaborators: [],
        comments: 0,
        image: post.featuredImage,
        slug: post.slug,
        excerpt: post.excerpt
      })),
      ...projects.map(project => ({
        id: project.id,
        title: project.title,
        type: 'project' as const,
        author: 'Admin', // Projects don't have author field in current schema
        lastModified: project.updated_at?.toISOString() || project.created_at?.toISOString() || new Date().toISOString(),
        status: project.status === 'published' ? 'published' as const : 'draft' as const,
        collaborators: [],
        comments: 0,
        image: project.image,
        slug: project.slug,
        description: project.description
      }))
    ];

    // Filter by status if provided
    const filteredItems = status 
      ? contentItems.filter(item => item.status === status)
      : contentItems;

    // Sort by last modified date (newest first)
    filteredItems.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json(filteredItems);
  } catch (error) {
    console.error('Error fetching content items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content items' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/content-items - Delete a content item (post or project)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { id, type } = await request.json();

    if (!id || !type) {
      return NextResponse.json(
        { error: 'Missing id or type' },
        { status: 400 }
      );
    }

    let success = false;

    if (type === 'post') {
      success = await PostService.deletePost(id);
    } else if (type === 'project') {
      success = await ProjectService.deleteProject(id);
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be post or project' },
        { status: 400 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Content item deleted successfully' });
  } catch (error) {
    console.error('Error deleting content item:', error);
    return NextResponse.json(
      { error: 'Failed to delete content item' },
      { status: 500 }
    );
  }
} 

