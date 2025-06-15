import dbConnect, { isMockMode } from '@/lib/db';
import Project from '@/lib/models/Project';
import { SortOrder } from 'mongoose';

export interface ProjectData {
  id: string;
  title: string;
  slug: string;
  description: string;
  image?: string;
  technologies: string[];
  liveDemo?: string;
  sourceCode?: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to provide robust image paths with fallbacks
export function getImagePath(imagePath: string | undefined): string {
  if (!imagePath) return '/images/projects/placeholder.jpg';
  
  // For static image paths, always return the direct path
  if (imagePath.startsWith('/')) {
    // Clean up any potential double slashes
    const cleanPath = imagePath.replace(/\/+/g, '/');
    
    // Add a development cache-busting parameter if in a local image path
    if (process.env.NODE_ENV === 'development') {
      return `${cleanPath}`;
    }
    
    return cleanPath;
  }
  
  // For external images, validate URL and return as is
  try {
    new URL(imagePath);
    return imagePath;
  } catch (e) {
    console.warn(`Invalid image URL: ${imagePath}, using placeholder instead`);
    return '/images/projects/placeholder.jpg';
  }
}

// Mock data for development when MongoDB is not available
const mockProjects: ProjectData[] = [
  {
    id: '1',
    title: 'E-Commerce Platform',
    slug: 'ecommerce-platform',
    description: 'A full-featured online store with payment integration, user authentication, and admin dashboard.',
    image: '/images/projects/ecommerce-platform.svg',
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    liveDemo: 'https://example-ecommerce.com',
    sourceCode: 'https://github.com/johndoe/ecommerce-platform',
    featured: true,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-02-20')
  },
  {
    id: '2',
    title: 'Task Management App',
    slug: 'task-management-app',
    description: 'A productivity tool for managing tasks, projects, and team collaboration with real-time updates.',
    image: '/images/projects/task-management.svg',
    technologies: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL'],
    liveDemo: 'https://taskmaster-app.com',
    sourceCode: 'https://github.com/johndoe/task-management',
    featured: true,
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-04-05')
  },
  {
    id: '3',
    title: 'AI Image Generator',
    slug: 'ai-image-generator',
    description: 'An application that generates images from text descriptions using AI models and APIs.',
    image: '/images/projects/ai-image-generator.svg',
    technologies: ['Python', 'TensorFlow', 'FastAPI', 'React'],
    liveDemo: 'https://ai-imagine.com',
    sourceCode: 'https://github.com/johndoe/ai-image-gen',
    featured: true,
    createdAt: new Date('2023-05-15'),
    updatedAt: new Date('2023-06-01')
  },
  {
    id: '4',
    title: 'Weather Dashboard',
    slug: 'weather-dashboard',
    description: 'A responsive weather application with detailed forecasts and interactive charts.',
    image: '/images/projects/weather-dashboard.svg',
    technologies: ['JavaScript', 'React', 'Weather API', 'Chart.js'],
    liveDemo: 'https://weather-dashboard.com',
    sourceCode: 'https://github.com/johndoe/weather-dashboard',
    featured: false,
    createdAt: new Date('2023-07-10'),
    updatedAt: new Date('2023-08-15')
  }
];

export interface ProjectQuery {
  featured?: boolean;
  limit?: number;
  slug?: string;
  skip?: number;
  sort?: Record<string, SortOrder>;
}

// Helper function to determine if we should use mock data
const useMockData = () => {
  return isMockMode();
};

export async function getProjects(query: ProjectQuery = {}): Promise<ProjectData[]> {
  // Use mock data if MongoDB is not available
  if (useMockData()) {
    const { featured, limit = 10, skip = 0 } = query;
    
    let filteredProjects = [...mockProjects];
    
    // Apply filters
    if (featured !== undefined) {
      filteredProjects = filteredProjects.filter(project => project.featured === featured);
    }
    
    // Apply sorting - default to newest first
    filteredProjects.sort((a, b) => {
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
    
    // Process image paths to ensure they're robust
    filteredProjects = filteredProjects.map(project => ({
      ...project,
      image: getImagePath(project.image)
    }));
    
    // Apply pagination
    return filteredProjects.slice(skip, skip + limit);
  }
  
  // Otherwise, use MongoDB
  try {
    await dbConnect();
    
    const { featured, limit = 10, skip = 0, sort = { updatedAt: -1 } } = query;
    
    // Build query filter
    const filter: Record<string, any> = {};
    if (featured !== undefined) {
      filter.featured = featured;
    }
    
    const projects = await Project.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    return projects.map((project: any) => ({
      id: project._id.toString(),
      title: project.title,
      slug: project.slug,
      description: project.description,
      image: getImagePath(project.image),
      technologies: project.technologies,
      liveDemo: project.liveDemo,
      sourceCode: project.sourceCode,
      featured: project.featured,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    // Return mock projects as fallback with processed image paths
    return mockProjects.map(project => ({
      ...project,
      image: getImagePath(project.image)
    }));
  }
}

export async function getProjectBySlug(slug: string): Promise<ProjectData | null> {
  // Use mock data if MongoDB is not available
  if (useMockData()) {
    const project = mockProjects.find(p => p.slug === slug);
    if (!project) return null;
    
    // Ensure the image path is robust
    return {
      ...project,
      image: getImagePath(project.image)
    };
  }
  
  // Otherwise, use MongoDB
  try {
    await dbConnect();
    
    const project = await Project.findOne({ slug });
    if (!project) return null;
    
    return {
      id: (project as any)._id.toString(),
      title: project.title,
      slug: project.slug,
      description: project.description,
      image: getImagePath(project.image),
      technologies: project.technologies,
      liveDemo: project.liveDemo,
      sourceCode: project.sourceCode,
      featured: project.featured,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  } catch (error) {
    console.error('Error fetching project by slug:', error);
    
    // Fallback to mock data
    const project = mockProjects.find(p => p.slug === slug);
    if (!project) return null;
    
    return {
      ...project,
      image: getImagePath(project.image)
    };
  }
} 