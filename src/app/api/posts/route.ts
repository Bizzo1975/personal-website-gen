import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';
import { PermissionService } from '@/lib/services/permission-service';
import { query } from '@/lib/db';

// GET /api/posts - Get all posts with permission filtering
export async function GET(request: Request) {
  try {
    // Get user session for permission filtering (wrap in try/catch to handle errors gracefully)
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      // If session check fails, continue without user context (public access)
      console.warn('Session check failed, continuing as public:', sessionError);
    }
    const userEmail = session?.user?.email;

    // Get posts with permission filtering
    const posts = await PostService.getAllPosts(userEmail || undefined);

    return NextResponse.json({
      posts,
      meta: {
        total: posts.length,
        filtered: userEmail ? true : false,
        userContext: {
          isAuthenticated: !!userEmail,
          email: userEmail
        }
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch posts',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post (admin only)
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('POST /api/posts - No session or email');
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await PermissionService.isUserAdmin(session.user.email);
    if (!isAdmin) {
      console.error('POST /api/posts - User is not admin:', session.user.email);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get the user's ID from the database
    const userQuery = await query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userQuery.rows.length === 0) {
      console.error('POST /api/posts - User not found in database:', session.user.email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userQuery.rows[0].id;

    // Parse request body
    const postData = await request.json();
    console.log('POST /api/posts - Received post data:', JSON.stringify(postData, null, 2));
    
    // Validate required fields
    if (!postData.title || !postData.slug || !postData.content) {
      console.error('POST /api/posts - Missing required fields:', {
        title: !!postData.title,
        slug: !!postData.slug,
        content: !!postData.content
      });
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Validate permission level
    const permissionLevel = postData.permissions?.level || postData.permissionLevel || postData.permission_level || 'all';
    if (!PermissionService.isValidPermissionLevel(permissionLevel)) {
      console.error('POST /api/posts - Invalid permission level:', permissionLevel);
      return NextResponse.json(
        { error: 'Invalid permission level. Must be one of: all, professional, personal' },
        { status: 400 }
      );
    }
    
    // Convert camelCase to database format
    const dbPostData = {
      title: postData.title,
      slug: postData.slug,
      content: postData.content,
      excerpt: postData.excerpt,
      featured_image: postData.featuredImage || postData.featured_image,
      tags: postData.tags || [],
      author: postData.author || session.user.email,
      read_time: postData.readTime || postData.read_time || 5,
      date: postData.date ? new Date(postData.date) : new Date(),
      permission_level: permissionLevel,
      status: postData.status || (postData.published ? 'published' : 'draft'),
      published: postData.published || false,
      featured: postData.featured || false
    };
    
    console.log('POST /api/posts - Converted db data:', JSON.stringify(dbPostData, null, 2));
    console.log('POST /api/posts - User ID:', userId);
    
    // Create new post with PostService
    const newPost = await PostService.createPost(dbPostData, userId);
    
    console.log('POST /api/posts - Created post:', JSON.stringify(newPost, null, 2));
    
    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');
    
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('POST /api/posts - Error creating post:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      console.error('POST /api/posts - Error message:', error.message);
      console.error('POST /api/posts - Error stack:', error.stack);
      
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 
