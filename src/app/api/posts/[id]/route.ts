import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';

// GET /api/posts/[id] - Get a specific post
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const post = await PostService.getPostById(params.id);
    
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

    // Update the post using PostService
    const updatedPost = await PostService.updatePost(params.id, {
      title: postData.title,
      slug: postData.slug,
      content: postData.content,
      excerpt: postData.excerpt,
      image: postData.featuredImage,
      tags: postData.tags || [],
      author: postData.author || session.user.email,
      readTime: postData.readTime || 5,
      date: postData.publishedAt ? new Date(postData.publishedAt) : new Date(),
      permissionLevel: postData.permissions?.level || 'all',
      published: postData.published || false
    });

    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');
    revalidatePath(`/blog/${updatedPost.slug}`);

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    
    if (error.message.includes('Post not found')) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
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