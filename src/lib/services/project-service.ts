import { query } from '@/lib/db';
import { Project, CreateProjectData, UpdateProjectData } from '@/lib/models/Project';
import CacheService from '@/lib/cache';

export class ProjectService {
  // Get all published projects with optional permission filtering
  static async getAllProjects(userEmail?: string): Promise<Project[]> {
    try {
      const cache = CacheService.getInstance();
      const cacheKey = CacheService.getProjectsListKey({ userEmail });
      
      // Try to get from cache first
      const cachedProjects = await cache.get<Project[]>(cacheKey);
      if (cachedProjects) {
        return cachedProjects;
      }

      let queryText = `
        SELECT 
          id,
          title,
          slug,
          description,
          content,
          image,
          technologies,
          live_demo,
          source_code,
          featured,
          permission_level,
          status,
          created_at,
          updated_at
        FROM projects 
        WHERE status = 'published'
        ORDER BY featured DESC, created_at DESC
      `;
      
      const result = await query(queryText);
      const projects = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        content: row.content,
        image: row.image,
        technologies: row.technologies || [],
        live_demo: row.live_demo,
        source_code: row.source_code,
        featured: row.featured,
        permission_level: row.permission_level,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      // Filter by user permissions if userEmail is provided
      let filteredProjects;
      if (userEmail) {
        filteredProjects = await this.filterProjectsByPermissions(projects, userEmail);
      } else {
        // Return only public projects if no user context
        filteredProjects = projects.filter(project => project.permission_level === 'all');
      }

      // Cache the results for 30 minutes
      await cache.set(cacheKey, filteredProjects, 1800);

      return filteredProjects;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw new Error('Failed to fetch projects from database');
    }
  }

  // Get a single project by ID
  static async getProjectById(id: string): Promise<Project | null> {
    try {
      const result = await query(
        'SELECT * FROM projects WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        content: row.content,
        image: row.image,
        technologies: row.technologies || [],
        live_demo: row.live_demo,
        source_code: row.source_code,
        featured: row.featured,
        permission_level: row.permission_level,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      console.error('Failed to fetch project by ID:', error);
      throw new Error('Failed to fetch project by ID from database');
    }
  }

  // Get featured projects
  static async getFeaturedProjects(userEmail?: string): Promise<Project[]> {
    try {
      const result = await query(
        `SELECT * FROM projects 
         WHERE featured = true AND status = 'published' 
         ORDER BY created_at DESC`
      );

      const projects = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        content: row.content,
        image: row.image,
        technologies: row.technologies || [],
        live_demo: row.live_demo,
        source_code: row.source_code,
        featured: row.featured,
        permission_level: row.permission_level,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      if (userEmail) {
        return await this.filterProjectsByPermissions(projects, userEmail);
      }

      return projects.filter(project => project.permission_level === 'all');
    } catch (error) {
      console.error('Failed to fetch featured projects:', error);
      throw new Error('Failed to fetch featured projects from database');
    }
  }

  // Get a single project by slug
  static async getProjectBySlug(slug: string, userEmail?: string): Promise<Project | null> {
    try {
      const result = await query(
        'SELECT * FROM projects WHERE slug = $1 AND status = $2',
        [slug, 'published']
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const project: Project = {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        content: row.content,
        image: row.image,
        technologies: row.technologies || [],
        live_demo: row.live_demo,
        source_code: row.source_code,
        featured: row.featured,
        permission_level: row.permission_level,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      // Check if user has permission to view this project
      if (project.permission_level !== 'all' && !userEmail) {
        return null;
      }

      if (project.permission_level !== 'all' && userEmail) {
        const hasPermission = await this.checkUserPermission(userEmail, project.permission_level);
        if (!hasPermission) {
          return null;
        }
      }

      return project;
    } catch (error) {
      console.error('Failed to fetch project by slug:', error);
      throw new Error('Failed to fetch project from database');
    }
  }

  // Get a single project by slug for admin preview (includes draft content)
  static async getProjectBySlugForPreview(slug: string): Promise<Project | null> {
    try {
      const result = await query(
        'SELECT * FROM projects WHERE slug = $1',
        [slug]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        content: row.content,
        image: row.image,
        technologies: row.technologies || [],
        live_demo: row.live_demo,
        source_code: row.source_code,
        featured: row.featured,
        permission_level: row.permission_level,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      console.error('Failed to fetch project by slug for preview:', error);
      throw new Error('Failed to fetch project from database');
    }
  }

  // Get projects by technology
  static async getProjectsByTechnology(technology: string, userEmail?: string): Promise<Project[]> {
    try {
      const result = await query(
        'SELECT * FROM projects WHERE $1 = ANY(technologies) AND status = $2 ORDER BY created_at DESC',
        [technology, 'published']
      );

      const projects = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        content: row.content,
        image: row.image,
        technologies: row.technologies || [],
        live_demo: row.live_demo,
        source_code: row.source_code,
        featured: row.featured,
        permission_level: row.permission_level,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      if (userEmail) {
        return await this.filterProjectsByPermissions(projects, userEmail);
      }

      return projects.filter(project => project.permission_level === 'all');
    } catch (error) {
      console.error('Failed to fetch projects by technology:', error);
      throw new Error('Failed to fetch projects by technology from database');
    }
  }

  // Create a new project (admin only)
  static async createProject(projectData: CreateProjectData, createdBy: string): Promise<Project> {
    try {
      const result = await query(
        `INSERT INTO projects (
          title, slug, description, content, image, technologies, 
          live_demo, source_code, featured, permission_level, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING *`,
        [
          projectData.title,
          projectData.slug,
          projectData.description,
          projectData.content,
          projectData.image,
          projectData.technologies,
          projectData.live_demo,
          projectData.source_code,
          projectData.featured || false,
          projectData.permission_level || 'all',
          projectData.status || 'draft',
          createdBy
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        content: row.content,
        image: row.image,
        technologies: row.technologies || [],
        live_demo: row.live_demo,
        source_code: row.source_code,
        featured: row.featured,
        permission_level: row.permission_level,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new Error('Failed to create project in database');
    }
  }

  // Update a project (admin only)
  static async updateProject(id: string, projectData: UpdateProjectData): Promise<Project> {
    try {
      const result = await query(
        `UPDATE projects SET 
          title = COALESCE($2, title),
          slug = COALESCE($3, slug),
          description = COALESCE($4, description),
          content = COALESCE($5, content),
          image = COALESCE($6, image),
          technologies = COALESCE($7, technologies),
          live_demo = COALESCE($8, live_demo),
          source_code = COALESCE($9, source_code),
          featured = COALESCE($10, featured),
          permission_level = COALESCE($11, permission_level),
          status = COALESCE($12, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 RETURNING *`,
        [
          id,
          projectData.title,
          projectData.slug,
          projectData.description,
          projectData.content,
          projectData.image,
          projectData.technologies,
          projectData.live_demo,
          projectData.source_code,
          projectData.featured,
          projectData.permission_level,
          projectData.status
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Project not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        content: row.content,
        image: row.image,
        technologies: row.technologies || [],
        live_demo: row.live_demo,
        source_code: row.source_code,
        featured: row.featured,
        permission_level: row.permission_level,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      console.error('Failed to update project:', error);
      throw new Error('Failed to update project in database');
    }
  }

  // Delete a project (admin only)
  static async deleteProject(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM projects WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new Error('Failed to delete project from database');
    }
  }

  // Get all projects for admin (including unpublished)
  static async getAllProjectsForAdmin(): Promise<Project[]> {
    try {
      const result = await query(
        'SELECT * FROM projects ORDER BY created_at DESC'
      );

      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        content: row.content,
        image: row.image,
        technologies: row.technologies || [],
        live_demo: row.live_demo,
        source_code: row.source_code,
        featured: row.featured,
        permission_level: row.permission_level,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Failed to fetch projects for admin:', error);
      throw new Error('Failed to fetch projects for admin from database');
    }
  }

  // Helper method to check user permissions
  private static async checkUserPermission(email: string, requiredLevel: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT has_professional_access, has_personal_access FROM user_access_levels WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const { has_professional_access, has_personal_access } = result.rows[0];

      if (requiredLevel === 'professional' && has_professional_access) {
        return true;
      }

      if (requiredLevel === 'personal' && has_personal_access) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check user permission:', error);
      return false;
    }
  }

  // Helper method to filter projects by user permissions
  private static async filterProjectsByPermissions(projects: Project[], userEmail: string): Promise<Project[]> {
    try {
      const result = await query(
        'SELECT has_professional_access, has_personal_access FROM user_access_levels WHERE email = $1 AND is_active = true',
        [userEmail]
      );

      if (result.rows.length === 0) {
        // User has no special access, return only public projects
        return projects.filter(project => project.permission_level === 'all');
      }

      const { has_professional_access, has_personal_access } = result.rows[0];

      return projects.filter(project => {
        if (project.permission_level === 'all') return true;
        if (project.permission_level === 'professional' && has_professional_access) return true;
        if (project.permission_level === 'personal' && has_personal_access) return true;
        return false;
      });
    } catch (error) {
      console.error('Failed to filter projects by permissions:', error);
      // Return only public projects on error
      return projects.filter(project => project.permission_level === 'all');
    }
  }
}

// ProjectData interface for backward compatibility
export interface ProjectData {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  image?: string;
  technologies: string[];
  liveDemo?: string;
  sourceCode?: string;
  featured: boolean;
  permissionLevel: 'all' | 'professional' | 'personal';
  status: 'draft' | 'scheduled' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

// Simple function exports for backward compatibility
export interface GetProjectsOptions {
  limit?: number;
  featured?: boolean;
  technology?: string;
  userEmail?: string;
}

export async function getProjects(options: GetProjectsOptions = {}): Promise<ProjectData[]> {
  try {
    const { limit, featured, technology, userEmail } = options;
    
    let projects: Project[];
    
    if (featured) {
      projects = await ProjectService.getFeaturedProjects(userEmail);
    } else if (technology) {
      projects = await ProjectService.getProjectsByTechnology(technology, userEmail);
    } else {
      projects = await ProjectService.getAllProjects(userEmail);
    }
    
    // Apply limit if specified
    if (limit && limit > 0) {
      projects = projects.slice(0, limit);
    }
    
    // Convert to ProjectData format
    return projects.map(project => ({
      id: project.id,
      title: project.title,
      slug: project.slug,
      description: project.description,
      content: project.content,
      image: project.image,
      technologies: project.technologies,
      liveDemo: project.live_demo,
      sourceCode: project.source_code,
      featured: project.featured,
      permissionLevel: project.permission_level,
      status: project.status,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }));
  } catch (error) {
    console.error('Error in getProjects:', error);
    return [];
  }
}

export async function getProjectBySlug(slug: string, userEmail?: string): Promise<ProjectData | null> {
  try {
    const project = await ProjectService.getProjectBySlug(slug, userEmail);
    if (!project) return null;
    
    return {
      id: project.id,
      title: project.title,
      slug: project.slug,
      description: project.description,
      content: project.content,
      image: project.image,
      technologies: project.technologies,
      liveDemo: project.live_demo,
      sourceCode: project.source_code,
      featured: project.featured,
      permissionLevel: project.permission_level,
      status: project.status,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    };
  } catch (error) {
    console.error('Error in getProjectBySlug:', error);
    return null;
  }
}  
// ProjectData interface for backward compatibility 
