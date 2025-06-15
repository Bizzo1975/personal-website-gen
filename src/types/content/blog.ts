import { SortOrder } from 'mongoose';
import { ContentPermissions } from './permissions';

/**
 * Represents a blog post in the application
 */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  date: string;
  readTime: number;
  excerpt: string;
  content: string;
  tags: string[];
  author: string;
  published: boolean;
  updatedAt: Date;
  featuredImage?: string;
  seoDescription?: string;
  category?: string;
  permissions: ContentPermissions;
}

/**
 * Parameters for querying blog posts
 */
export interface BlogPostQuery {
  published?: boolean;
  limit?: number;
  skip?: number;
  tag?: string;
  category?: string;
  author?: string;
  searchTerm?: string;
  sort?: Record<string, SortOrder>;
  permissionLevel?: 'personal' | 'professional' | 'all';
  userRole?: string;
  userId?: string;
}

/**
 * Props for blog listing components
 */
export interface BlogListingProps {
  posts: BlogPost[];
  isLoading?: boolean;
  error?: string;
}

/**
 * Props for blog detail components
 */
export interface BlogDetailProps {
  post: BlogPost;
  relatedPosts?: BlogPost[];
  isLoading?: boolean;
  error?: string;
}

/**
 * Props for blog search components
 */
export interface BlogSearchProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  placeholder?: string;
}

/**
 * Blog post creation/update data
 */
export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  category?: string;
  featuredImage?: string;
  seoDescription?: string;
  published: boolean;
  permissions: ContentPermissions;
}

/**
 * Type for blog post metadata used in SEO
 */
export interface BlogPostMetadata {
  title: string;
  description: string;
  author: string;
  date: string;
  tags: string[];
  image?: string;
  url?: string;
}
