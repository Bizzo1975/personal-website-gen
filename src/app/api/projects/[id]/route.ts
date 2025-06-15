import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';

// Mock projects data store (this should match the one in the main projects route)
let mockProjects = [
  {
    id: '1',
    title: 'E-commerce Platform',
    slug: 'ecommerce-platform',
    description: 'A full-featured e-commerce platform built with Next.js.',
    image: '/images/projects/ecommerce-platform.svg',
    technologies: ['Next.js', 'React', 'MongoDB', 'Stripe', 'Tailwind CSS'],
    liveDemo: 'https://example.com/ecommerce',
    sourceCode: 'https://github.com/johndoe/ecommerce',
    featured: true,
    permissions: {
      level: 'all',
      allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: false,
      customRules: []
    }
  },
  {
    id: '2',
    title: 'Task Management App',
    slug: 'task-management-app',
    description: 'A productivity application for managing tasks and projects.',
    image: '/images/projects/task-management.svg',
    technologies: ['React', 'TypeScript', 'Redux', 'Firebase'],
    liveDemo: 'https://example.com/taskmanager',
    sourceCode: 'https://github.com/johndoe/taskmanager',
    featured: false,
    permissions: {
      level: 'professional',
      allowedRoles: ['admin', 'editor', 'author'],
      allowedUsers: ['client@example.com'],
      restrictedUsers: [],
      requiresAuth: true,
      customRules: []
    }
  },
  {
    id: '3',
    title: 'Weather Dashboard',
    slug: 'weather-dashboard',
    description: 'A responsive weather application with forecasts.',
    image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    technologies: ['JavaScript', 'React', 'Weather API', 'Chart.js'],
    liveDemo: 'https://example.com/weather',
    sourceCode: 'https://github.com/johndoe/weather',
    featured: true,
  },
  {
    id: '4',
    title: 'Personal Finance Tracker',
    slug: 'personal-finance-tracker',
    description: 'An application to track income, expenses, and savings.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma'],
    liveDemo: 'https://example.com/finance',
    sourceCode: 'https://github.com/johndoe/finance',
    featured: false,
  },
];

// GET /api/projects/[id] - Get a specific project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = mockProjects.find(p => p.id === params.id);
    
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
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectData = await request.json();
    const projectIndex = mockProjects.findIndex(p => p.id === params.id);
    
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!projectData.title || !projectData.slug || !projectData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and description are required' },
        { status: 400 }
      );
    }

    // Check for duplicate slug (excluding current project)
    const slugExists = mockProjects.some(project => project.slug === projectData.slug && project.id !== params.id);
    if (slugExists) {
      return NextResponse.json(
        { error: 'A project with this slug already exists' },
        { status: 400 }
      );
    }

    // Update the project
    const updatedProject = {
      ...mockProjects[projectIndex],
      ...projectData,
      id: params.id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    mockProjects[projectIndex] = updatedProject;

    // Revalidate projects pages
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath(`/projects/${updatedProject.slug}`);

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
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
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectIndex = mockProjects.findIndex(p => p.id === params.id);
    
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const deletedProject = mockProjects[projectIndex];
    mockProjects.splice(projectIndex, 1);

    // Revalidate projects pages
    revalidatePath('/projects');
    revalidatePath('/admin/projects');

    return NextResponse.json({ message: 'Project deleted successfully', project: deletedProject });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
} 