import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';

// Mock projects data store (replace with actual database in production)
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

// GET /api/projects - Get all projects
export async function GET() {
  try {
    // In a real application, fetch from database
    return NextResponse.json(mockProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const projectData = await request.json();
    
    // Validate required fields
    if (!projectData.title || !projectData.slug || !projectData.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check for duplicate slug
    const slugExists = mockProjects.some(project => project.slug === projectData.slug);
    if (slugExists) {
      return NextResponse.json(
        { error: 'A project with this slug already exists' },
        { status: 400 }
      );
    }
    
    // Create new project
    const newProject = {
      id: Date.now().toString(),
      ...projectData,
      technologies: projectData.technologies || [],
      featured: Boolean(projectData.featured),
      createdAt: new Date().toISOString()
    };
    
    // In a real app, save to database
    mockProjects.push(newProject);
    
    // Revalidate projects page
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 