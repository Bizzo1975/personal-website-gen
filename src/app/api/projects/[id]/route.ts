import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { ProjectService } from '@/lib/services/project-service';

// GET /api/projects/[id] - Get a specific project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await ProjectService.getProjectById(params.id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a specific project
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectData = await request.json();
    
    // Validate required fields
    if (!projectData.title || !projectData.slug || !projectData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and description are required' },
        { status: 400 }
      );
    }

    // Update the project using ProjectService
    const updatedProject = await ProjectService.updateProject(params.id, {
      title: projectData.title,
      slug: projectData.slug,
      description: projectData.description,
      content: projectData.content,
      image: projectData.image,
      technologies: projectData.technologies || [],
      live_demo: projectData.liveDemo,
      source_code: projectData.sourceCode,
      featured: projectData.featured || false,
      permission_level: projectData.permissions?.level || 'all',
      status: projectData.status || 'draft'
    });

    // Revalidate projects pages
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath(`/projects/${updatedProject.slug}`);

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Project not found')) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return NextResponse.json(
        { error: 'A project with this slug already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a specific project
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const success = await ProjectService.deleteProject(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Revalidate projects pages
    revalidatePath('/projects');
    revalidatePath('/admin/projects');

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
} 