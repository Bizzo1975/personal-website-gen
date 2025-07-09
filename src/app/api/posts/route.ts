import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';
import { PermissionService } from '@/lib/services/permission-service';

// GET /api/posts - Get all posts with permission filtering
export async function GET(request: Request) {
  try {
    // Get user session for permission filtering
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    // Get posts with permission filtering
    const posts = await PostService.getAllPosts(userEmail);

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
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
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
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await PermissionService.isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const postData = await request.json();
    
    // Validate required fields
    if (!postData.title || !postData.slug || !postData.content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Validate permission level
    if (postData.permissionLevel && !PermissionService.isValidPermissionLevel(postData.permissionLevel)) {
      return NextResponse.json(
        { error: 'Invalid permission level. Must be one of: all, professional, personal' },
        { status: 400 }
      );
    }
    
    // Create new post with PostService
    const newPost = await PostService.createPost(postData, session.user.id || session.user.email);
    
    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/admin/posts');
    
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    
    // Handle specific database errors
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 
