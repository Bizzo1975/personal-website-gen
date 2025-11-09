import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';
import { revalidatePath } from 'next/cache';

// DELETE /api/admin/posts/[id] - Delete a post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Delete the post
    const success = await PostService.deletePost(resolvedParams.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');
    revalidatePath('/admin/content-management');

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/posts/[id] - Update a post (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const postData = await request.json();
    
    // Convert camelCase to database format
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
      permission_level: postData.permissions?.level || postData.permissionLevel || postData.permission_level || 'all',
      published: postData.published || false
    };

    // Update the post
    const updatedPost = await PostService.updatePost(resolvedParams.id, updateData);

    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');
    revalidatePath('/admin/content-management');

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
} 