import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { ProjectService } from '@/lib/services/project-service';
import { PermissionService } from '@/lib/services/permission-service';
import { query } from '@/lib/db';

// GET /api/projects - Get all projects with permission filtering
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

    // Check if user is admin (only if userEmail exists)
    let isAdmin = false;
    if (userEmail) {
      try {
        isAdmin = await PermissionService.isUserAdmin(userEmail);
      } catch (adminError) {
        console.warn('Error checking admin status, defaulting to false:', adminError);
        isAdmin = false;
      }
    }

    let projects;
    
    if (isAdmin) {
      // Admin gets all projects (including draft)
      projects = await ProjectService.getAllProjectsForAdmin();
    } else {
      // Regular users get only published projects with permission filtering
      projects = await ProjectService.getAllProjects(userEmail || undefined);
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
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
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

    // Get the user's ID from the database
    const userQuery = await query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userQuery.rows[0].id;

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
    const permissionLevel = projectData.permissionLevel || projectData.permission_level || 'all';
    if (!PermissionService.isValidPermissionLevel(permissionLevel)) {
      return NextResponse.json(
        { error: 'Invalid permission level. Must be one of: all, professional, personal' },
        { status: 400 }
      );
    }
    
    // Convert camelCase to database format
    const dbProjectData = {
      title: projectData.title,
      slug: projectData.slug,
      description: projectData.description,
      content: projectData.content || '',
      image: projectData.image,
      technologies: projectData.technologies || [],
      live_demo: projectData.liveDemo || projectData.live_demo,
      source_code: projectData.sourceCode || projectData.source_code,
      featured: projectData.featured || false,
      permission_level: permissionLevel,
      status: projectData.status || 'draft'
    };
    
    // Create new project with ProjectService
    const newProject = await ProjectService.createProject(dbProjectData, userId);
    
    // Revalidate projects page
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    
    // Handle specific database errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
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
