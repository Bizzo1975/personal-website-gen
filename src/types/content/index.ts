// Export all content-related types
export interface PageData {
  id: string;
  name?: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  heroHeading?: string;
  connectSectionTitle?: string;
  connectSectionContent?: string;
  formSectionTitle?: string;
  formDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
  published: boolean;
  featuredImage?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentData {
  id: string;
  postId: string;
  name: string;
  email: string;
  content: string;
  approved: boolean;
  createdAt: Date;
}

export interface QueryOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  featured?: boolean;
  published?: boolean;
}

// Re-export for backwards compatibility
export type { PageData as Page };
export type { PostData as Post };
export type { CommentData as Comment }; 