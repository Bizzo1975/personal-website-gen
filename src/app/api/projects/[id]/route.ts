import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';

// Import the mockProjects data (in a real app, this would be a database call)
// Note: In a real application, this would be a database import
// This is temporary for this demo
let mockProjects = [
  {
    id: '1',
    title: 'E-commerce Platform',
    slug: 'ecommerce-platform',
    description: 'A full-featured e-commerce platform built with Next.js.',
    image: 'https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    technologies: ['Next.js', 'React', 'MongoDB', 'Stripe', 'Tailwind CSS'],
    liveDemo: 'https://example.com/ecommerce',
    sourceCode: 'https://github.com/johndoe/ecommerce',
    featured: true,
  },
  {
    id: '2',
    title: 'Task Management App',
    slug: 'task-management-app',
    description: 'A productivity application for managing tasks and projects.',
    image: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    technologies: ['React', 'TypeScript', 'Redux', 'Firebase'],
    liveDemo: 'https://example.com/taskmanager',
    sourceCode: 'https://github.com/johndoe/taskmanager',
    featured: false,
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

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Find the project by ID
    const project = mockProjects.find(p => p.id === id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a project
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
    
    const { id } = params;
    const updatedData = await request.json();
    
    // Find the project index
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if updating slug and if it already exists
    if (
      updatedData.slug && 
      updatedData.slug !== mockProjects[projectIndex].slug &&
      mockProjects.some(p => p.id !== id && p.slug === updatedData.slug)
    ) {
      return NextResponse.json(
        { error: 'A project with this slug already exists' },
        { status: 400 }
      );
    }
    
    // Update the project
    mockProjects[projectIndex] = {
      ...mockProjects[projectIndex],
      ...updatedData,
      technologies: updatedData.technologies || mockProjects[projectIndex].technologies,
      featured: updatedData.featured !== undefined 
        ? Boolean(updatedData.featured) 
        : mockProjects[projectIndex].featured,
      updatedAt: new Date().toISOString()
    };
    
    // Revalidate projects page
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath(`/projects/${mockProjects[projectIndex].slug}`);
    
    return NextResponse.json(mockProjects[projectIndex]);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
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
    
    const { id } = params;
    
    // Find the project
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Store slug for revalidation
    const slug = mockProjects[projectIndex].slug;
    
    // Remove the project
    mockProjects = mockProjects.filter(p => p.id !== id);
    
    // Revalidate projects page
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath(`/projects/${slug}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
} 