import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { ProjectService } from '@/lib/services/project-service';
import { PermissionService } from '@/lib/services/permission-service';

// GET /api/projects - Get all projects with permission filtering
export async function GET(request: Request) {
  try {
    // Get user session for permission filtering
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    // Check if user is admin
    const isAdmin = userEmail ? await PermissionService.isUserAdmin(userEmail) : false;

    let projects;
    
    if (isAdmin) {
      // Admin gets all projects (including draft)
      projects = await ProjectService.getAllProjectsForAdmin();
    } else {
      // Regular users get only published projects with permission filtering
      projects = await ProjectService.getAllProjects(userEmail);
    }

    return NextResponse.json({
      projects,
      meta: {
        total: projects.length,
        filtered: userEmail ? true : false,
        userContext: {
          isAuthenticated: !!userEmail,
          email: userEmail,
          isAdmin: isAdmin
        }
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project (admin only)
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
    const projectData = await request.json();
    
    // Validate required fields
    if (!projectData.title || !projectData.slug || !projectData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and description are required' },
        { status: 400 }
      );
    }

    // Validate permission level
    if (projectData.permissionLevel && !PermissionService.isValidPermissionLevel(projectData.permissionLevel)) {
      return NextResponse.json(
        { error: 'Invalid permission level. Must be one of: all, professional, personal' },
        { status: 400 }
      );
    }
    
    // Create new project with ProjectService
    const newProject = await ProjectService.createProject(projectData, session.user.id || session.user.email);
    
    // Revalidate projects page
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    
    // Handle specific database errors
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'A project with this slug already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 
