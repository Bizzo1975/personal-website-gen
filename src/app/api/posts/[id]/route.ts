import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';

// GET /api/posts/[id] - Get a specific post by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get('preview') === 'true';
    
    // Check if user is authenticated (for admin access)
    const session = await getServerSession(authOptions);
    const isAdmin = session && session.user.role === 'admin';
    
    // If preview mode, require admin authentication
    if (isPreview && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const post = await PostService.getPostById(params.id);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Admin users can access any post, others can only access published posts
    if (!isAdmin && post.status !== 'published' && !post.published) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: post });
  } catch (error) {
    console.error('Error fetching post by ID:', error);
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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const postData = await request.json();
    
    // Validate required fields
    if (!postData.title || !postData.slug || !postData.content || !postData.excerpt) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content, and excerpt are required' },
        { status: 400 }
      );
    }

    // Update the post data
    const updateData = {
      title: postData.title,
      slug: postData.slug,
      content: postData.content,
      excerpt: postData.excerpt,
      featured_image: postData.featuredImage || postData.featured_image,
      tags: postData.tags || [],
      author: postData.author || session.user.email,
      read_time: postData.readTime || postData.read_time || 5,
      date: postData.date ? new Date(postData.date) : new Date(),
      permission_level: postData.permissions?.level || postData.permissionLevel || 'all',
      status: postData.status || 'draft',
      published: postData.status === 'published' || postData.published || false,
      featured: postData.featured || false
    };

    // Update the post using PostService
    const updatedPost = await PostService.updatePost(params.id, updateData);

    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');
    revalidatePath(`/blog/${updatedPost.slug}`);

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Post not found')) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const success = await PostService.deletePost(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
} 