import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';
import { query } from '@/lib/db';
import { parsePostStatus } from '@/lib/post-status';

// GET /api/posts/[id] - Get a specific post by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.id;
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }
    
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
    
    const post = await PostService.getPostById(postId);
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch post', details: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Update a specific post
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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

    // Fields the editor did not send keep their current values. (The admin edit form
    // sends no date/author/read time, so these used to be reset on every save: the
    // post's blog date became "now" and the author became the editor's email.)
    const currentResult = await query(
      'SELECT status, author, read_time, date, permission_level, featured, featured_image, scheduled_publish_at FROM posts WHERE id = $1',
      [resolvedParams.id]
    );
    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const current = currentResult.rows[0];

    const status = parsePostStatus(postData.status);
    if (status === false) {
      return NextResponse.json({ error: 'Status must be draft, scheduled or published' }, { status: 400 });
    }
    // W8: "scheduled" without a date would never publish (the scheduler needs a date and
    // the Content Scheduler only schedules drafts). Keep an existing schedule; refuse a new one here.
    if (status === 'scheduled' && current.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'To schedule this post, save it as a draft and set the date in the Content Scheduler.' },
        { status: 400 }
      );
    }

    const has = (k: string) => Object.prototype.hasOwnProperty.call(postData, k);
    const updateData = {
      title: postData.title,
      slug: postData.slug,
      content: postData.content,
      excerpt: postData.excerpt,
      featured_image: has('featuredImage') || has('featured_image')
        ? (postData.featuredImage ?? postData.featured_image ?? null)
        : current.featured_image,
      tags: Array.isArray(postData.tags) ? postData.tags : [],
      author: postData.author || current.author || session.user.email,
      read_time: postData.readTime || postData.read_time || current.read_time || 5,
      date: postData.date ? new Date(postData.date) : current.date,
      permission_level: postData.permissions?.level || postData.permissionLevel || current.permission_level || 'all',
      // status null = unchanged; published/schedule follow the status rule in updatePost
      status: (status ?? current.status) as 'draft' | 'scheduled' | 'published',
      featured: typeof postData.featured === 'boolean' ? postData.featured : current.featured
    };

    // Update the post using PostService
    const updatedPost = await PostService.updatePost(resolvedParams.id, updateData);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
} 