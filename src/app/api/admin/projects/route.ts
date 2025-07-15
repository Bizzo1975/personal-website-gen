import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { ProjectService } from '@/lib/services/project-service';

// GET /api/admin/projects - Get all projects for admin (including drafts)
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

    // Get all projects for admin (including drafts)
    const projects = await ProjectService.getAllProjectsForAdmin();

    return NextResponse.json({
      projects,
      meta: {
        total: projects.length,
        admin: true
      }
    });
  } catch (error) {
    console.error('Error fetching admin projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
} 