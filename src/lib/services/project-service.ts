import dbConnect from '@/lib/db';
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

export interface ProjectQuery {
  featured?: boolean;
  limit?: number;
  slug?: string;
  skip?: number;
  sort?: Record<string, SortOrder>;
}

export async function getProjects(query: ProjectQuery = {}): Promise<ProjectData[]> {
  await dbConnect();
  
  const { featured, limit = 10, skip = 0, sort = { updatedAt: -1 } } = query;
  
  try {
    // Build query filter
    const filter: Record<string, any> = {};
    if (featured !== undefined) {
      filter.featured = featured;
    }
    
    const projects = await Project.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    return projects.map(project => ({
      id: project._id.toString(),
      title: project.title,
      slug: project.slug,
      description: project.description,
      image: project.image,
      technologies: project.technologies,
      liveDemo: project.liveDemo,
      sourceCode: project.sourceCode,
      featured: project.featured,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<ProjectData | null> {
  await dbConnect();
  
  try {
    const project = await Project.findOne({ slug });
    if (!project) return null;
    
    return {
      id: project._id.toString(),
      title: project.title,
      slug: project.slug,
      description: project.description,
      image: project.image,
      technologies: project.technologies,
      liveDemo: project.liveDemo,
      sourceCode: project.sourceCode,
      featured: project.featured,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  } catch (error) {
    console.error('Error fetching project by slug:', error);
    return null;
  }
} 