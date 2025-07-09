import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';
import { ProjectService } from '@/lib/services/project-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all posts and projects for admin
    const [allPosts, allProjects] = await Promise.all([
      PostService.getAllPostsForAdmin(),
      ProjectService.getAllProjectsForAdmin()
    ]);

    // Filter only draft content (content that can be scheduled)
    const draftPosts = allPosts.filter(post => post.status === 'draft');
    const draftProjects = allProjects.filter(project => project.status === 'draft');

    // Format for scheduler component
    const availableContent = [
      ...draftPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        type: 'post',
        author: post.author || 'Unknown',
        excerpt: post.excerpt || `${post.title.substring(0, 100)}...`,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      })),
      ...draftProjects.map(project => ({
        id: project.id,
        title: project.title,
        slug: project.slug,
        type: 'project',
        author: 'Admin', // TODO: Get actual author from created_by
        excerpt: project.description ? `${project.description.substring(0, 100)}...` : `${project.title} project`,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }))
    ];

    // Sort by last updated date
    availableContent.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(availableContent);

  } catch (error) {
    console.error('Unscheduled content API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unscheduled content' },
      { status: 500 }
    );
  }
} 