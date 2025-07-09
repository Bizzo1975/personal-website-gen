import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';
import { ProjectService } from '@/lib/services/project-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'draft';

    // Fetch all posts and projects for admin
    const [allPosts, allProjects] = await Promise.all([
      PostService.getAllPostsForAdmin(),
      ProjectService.getAllProjectsForAdmin()
    ]);

    // Filter by status and format for content management page
    const filteredPosts = allPosts.filter(post => post.status === statusFilter);
    const filteredProjects = allProjects.filter(project => project.status === statusFilter);

    // Format posts for content management page
    const formattedPosts = filteredPosts.map(post => ({
      id: post.id,
      title: post.title,
      type: 'post' as const,
      author: post.author || 'Unknown',
      lastModified: post.updatedAt.toISOString(),
      status: post.status || (post.published ? 'published' : 'draft'),
      collaborators: [], // TODO: Implement collaborators if needed
      template: undefined, // TODO: Implement templates if needed
      comments: 0 // TODO: Implement comments count if needed
    }));

    // Format projects for content management page
    const formattedProjects = filteredProjects.map(project => ({
      id: project.id,
      title: project.title,
      type: 'project' as const,
      author: 'Admin', // TODO: Add createdBy field to ProjectService
      lastModified: project.updatedAt.toISOString(),
      status: project.status,
      collaborators: [], // TODO: Implement collaborators if needed
      template: undefined, // TODO: Implement templates if needed
      comments: 0 // TODO: Implement comments count if needed
    }));

    // Combine and sort by last modified date
    const allContentItems = [...formattedPosts, ...formattedProjects]
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json(allContentItems);
  } catch (error) {
    console.error('Content items API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 

