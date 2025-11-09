import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { ProjectService } from '@/lib/services/project-service';
import { revalidatePath } from 'next/cache';

// DELETE /api/admin/projects/[id] - Delete a project (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Delete the project
    const success = await ProjectService.deleteProject(resolvedParams.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Revalidate project pages
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath('/admin/content-management');

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/projects/[id] - Update a project (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const projectData = await request.json();
    
    // Convert camelCase to database format
    const updateData = {
      title: projectData.title,
      slug: projectData.slug,
      description: projectData.description,
      content: projectData.content,
      image: projectData.image,
      technologies: projectData.technologies || [],
      live_demo: projectData.liveDemo || projectData.live_demo,
      source_code: projectData.sourceCode || projectData.source_code,
      featured: projectData.featured || false,
      permission_level: projectData.permissions?.level || projectData.permissionLevel || projectData.permission_level || 'all',
      status: projectData.status || 'draft'
    };

    // Update the project
    const updatedProject = await ProjectService.updateProject(resolvedParams.id, updateData);

    // Revalidate project pages
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath('/admin/content-management');

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
} 