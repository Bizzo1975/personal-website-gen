import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PostService } from '@/lib/services/post-service';
import { ProjectService } from '@/lib/services/project-service';
import { query } from '@/lib/db';

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

    // W27: projects have no author column; use the user who created them (was hard-coded "Admin").
    const creators = new Map<string, string>();
    if (draftProjects.length > 0) {
      const r = await query(
        `SELECT p.id, COALESCE(NULLIF(u.name, ''), u.email) AS author
           FROM projects p LEFT JOIN users u ON u.id = p.created_by
          WHERE p.id = ANY($1::uuid[])`,
        [draftProjects.map((p) => p.id)]
      );
      for (const row of r.rows) if (row.author) creators.set(row.id, row.author);
    }

    // Format for scheduler component
    const availableContent = [
      ...draftPosts.map(post => ({
        id: post.id,
        type: 'post' as const,
        title: post.title,
        author: post.author || 'Unknown',
        excerpt: post.excerpt || `${post.title.substring(0, 100)}...`,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      })),
      ...draftProjects.map(project => ({
        id: project.id,
        type: 'project' as const,
        title: project.title,
        author: creators.get(project.id) || 'Unknown',
        excerpt: project.description || `${project.title} project`,
        createdAt: project.created_at,
        updatedAt: project.updated_at
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