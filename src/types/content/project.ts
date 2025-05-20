import { SortOrder } from 'mongoose';

/**
 * Represents a project in the portfolio
 */
export interface Project {
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
  details?: string;
  category?: string;
  status?: 'completed' | 'in-progress' | 'planned';
  client?: string;
  duration?: string;
}

/**
 * Parameters for querying projects
 */
export interface ProjectQuery {
  featured?: boolean;
  limit?: number;
  skip?: number;
  slug?: string;
  category?: string;
  technology?: string;
  status?: string;
  searchTerm?: string;
  sort?: Record<string, SortOrder>;
}

/**
 * Props for project listing components
 */
export interface ProjectListingProps {
  projects: Project[];
  isLoading?: boolean;
  error?: string;
}

/**
 * Props for project detail components
 */
export interface ProjectDetailProps {
  project: Project;
  relatedProjects?: Project[];
  isLoading?: boolean;
  error?: string;
}

/**
 * Props for project filter components
 */
export interface ProjectFilterProps {
  categories?: string[];
  technologies?: string[];
  statuses?: string[];
  onFilterChange: (filters: ProjectFilters) => void;
  initialFilters?: ProjectFilters;
}

/**
 * Filters that can be applied to project listings
 */
export interface ProjectFilters {
  category?: string;
  technology?: string;
  status?: string;
  searchTerm?: string;
}
