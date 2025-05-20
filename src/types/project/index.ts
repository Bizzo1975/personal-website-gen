export interface ProjectData {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  technologies: string[];
  featured: boolean;
  githubUrl?: string;
  demoUrl?: string;
  thumbnailUrl?: string;
  screenshots?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFilterOptions {
  featured?: boolean;
  technology?: string;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
} 