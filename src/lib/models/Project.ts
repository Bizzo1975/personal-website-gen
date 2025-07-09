// PostgreSQL Project interface matching the projects table schema
export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  image?: string;
  technologies: string[];
  live_demo?: string;
  source_code?: string;
  featured: boolean;
  permission_level: 'all' | 'professional' | 'personal';
  status: 'draft' | 'scheduled' | 'published';
  scheduled_publish_at?: Date;
  published_at?: Date;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

// Alias for backward compatibility
export type ProjectData = Project;

// Type for creating a new project
export interface CreateProjectData {
  title: string;
  slug: string;
  description: string;
  content?: string;
  image?: string;
  technologies?: string[];
  live_demo?: string;
  source_code?: string;
  featured?: boolean;
  permission_level?: 'all' | 'professional' | 'personal';
  status?: 'draft' | 'scheduled' | 'published';
  scheduled_publish_at?: Date;
  created_by?: string;
}

// Type for updating a project
export interface UpdateProjectData {
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  image?: string;
  technologies?: string[];
  live_demo?: string;
  source_code?: string;
  featured?: boolean;
  permission_level?: 'all' | 'professional' | 'personal';
  status?: 'draft' | 'scheduled' | 'published';
  scheduled_publish_at?: Date;
}

// Backward compatibility aliases
export interface OldProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  tech_stack: string[];
  features: string[];
  github_url?: string;
  live_url?: string;
  image_url?: string;
  status: 'active' | 'completed' | 'archived';
  date_completed?: Date;
  technologies: string[];
  created_at: Date;
  updated_at: Date;
} 