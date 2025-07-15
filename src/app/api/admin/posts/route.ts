import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';

// GET /api/admin/posts - Get all posts for admin (including drafts)
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

    // Get all posts for admin (including drafts)
    const posts = await PostService.getAllPostsForAdmin();

    return NextResponse.json({
      posts,
      meta: {
        total: posts.length,
        admin: true
      }
    });
  } catch (error) {
    console.error('Error fetching admin posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 