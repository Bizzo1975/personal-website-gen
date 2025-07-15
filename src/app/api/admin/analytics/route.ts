import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range for time-based queries
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Real database queries for all analytics data
    const [
      postsResult,
      draftPostsResult,
      scheduledPostsResult,
      projectsResult,
      draftProjectsResult,
      scheduledProjectsResult,
      usersResult,
      accessRequestsResult,
      pendingAccessRequestsResult,
      activeAccessLevelsResult,
      subscribersResult,
      campaignsResult,
      mediaFilesResult,
      recentContentResult
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM posts WHERE status = $1', ['published']),
      query('SELECT COUNT(*) FROM posts WHERE status = $1', ['draft']),
      query('SELECT COUNT(*) FROM posts WHERE status = $1', ['scheduled']),
      query('SELECT COUNT(*) FROM projects WHERE status = $1', ['published']),
      query('SELECT COUNT(*) FROM projects WHERE status = $1', ['draft']),
      query('SELECT COUNT(*) FROM projects WHERE status = $1', ['scheduled']),
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM access_requests'),
      query('SELECT COUNT(*) FROM access_requests WHERE status = $1', ['pending']),
      query('SELECT COUNT(*) FROM user_access_levels WHERE is_active = $1', [true]),
      query('SELECT COUNT(*) FROM newsletter_subscribers WHERE is_active = $1', [true]),
      query('SELECT COUNT(*) FROM newsletter_campaigns'),
      query('SELECT COUNT(*) FROM media_files'),
      query(`
        SELECT title, slug, created_at, 'post' as type FROM posts 
        WHERE status = $1 AND created_at >= $2
        UNION ALL
        SELECT title, slug, created_at, 'project' as type FROM projects 
        WHERE status = $3 AND created_at >= $4
        ORDER BY created_at DESC 
        LIMIT 5
      `, ['published', startDate, 'published', startDate])
    ]);

    // Get recent posts for content activity metrics
    const recentPostsResult = await query(
      'SELECT title, slug, created_at FROM posts WHERE status = $1 ORDER BY created_at DESC LIMIT 5',
      ['published']
    );

    // Calculate totals
    const totalPosts = parseInt(postsResult.rows[0].count);
    const draftPosts = parseInt(draftPostsResult.rows[0].count);
    const scheduledPosts = parseInt(scheduledPostsResult.rows[0].count);
    const totalProjects = parseInt(projectsResult.rows[0].count);
    const draftProjects = parseInt(draftProjectsResult.rows[0].count);
    const scheduledProjects = parseInt(scheduledProjectsResult.rows[0].count);
    const totalUsers = parseInt(usersResult.rows[0].count);
    const totalAccessRequests = parseInt(accessRequestsResult.rows[0].count);
    const pendingAccessRequests = parseInt(pendingAccessRequestsResult.rows[0].count);
    const activeAccessLevels = parseInt(activeAccessLevelsResult.rows[0].count);
    const totalSubscribers = parseInt(subscribersResult.rows[0].count);
    const totalCampaigns = parseInt(campaignsResult.rows[0].count);
    const totalMediaFiles = parseInt(mediaFilesResult.rows[0].count);

    // Transform recent content for display
    const recentContent = recentContentResult.rows.map((item) => ({
      title: item.title,
      slug: item.slug,
      type: item.type,
      createdAt: item.created_at
    }));

    // Transform recent posts for the popular posts section
    const popularPosts = recentPostsResult.rows.map((post) => ({
      title: post.title,
      slug: post.slug,
      // Instead of fake views, show days since creation
      daysSinceCreated: Math.floor((now.getTime() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24))
    }));

    const analyticsData = {
      // Content metrics (real data)
      totalPosts,
      totalProjects,
      totalUsers,
      
      // Content activity - total content created in time range
      totalContentActivity: recentContent.length,
      
      // Access and user metrics (real data)
      totalAccessRequests,
      pendingAccessRequests,
      activeAccessLevels,
      
      // Recent content instead of popular posts with views
      recentContent,
      popularPosts, // Now shows recent posts with creation dates instead of fake views
      
      // Real content statistics
      contentStats: {
        publishedPosts: totalPosts,
        draftPosts,
        scheduledPosts,
        totalProjects,
        draftProjects,
        scheduledProjects,
        pendingAccessRequests,
        activeUsers: activeAccessLevels
      },
      
      // Newsletter and media metrics (real data)
      newsletterStats: {
        totalSubscribers,
        totalCampaigns,
        totalMediaFiles
      },
      
      // System metrics (real data)
      systemStats: {
        totalUsers,
        totalAccessRequests,
        approvedAccessRequests: totalAccessRequests - pendingAccessRequests,
        contentActivity: recentContent.length
      }
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 

