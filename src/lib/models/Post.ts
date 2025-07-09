// PostgreSQL Post interface matching the posts table schema
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  tags: string[];
  author: string;
  read_time: number;
  date: Date;
  permission_level: 'all' | 'professional' | 'personal';
  status: 'draft' | 'scheduled' | 'published';
  scheduled_publish_at?: Date;
  published_at?: Date;
  published: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

// Alias for backward compatibility
export type PostData = Post;

// Type for creating a new post
export interface CreatePostData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  tags?: string[];
  author?: string;
  read_time?: number;
  date?: Date;
  permission_level?: 'all' | 'professional' | 'personal';
  status?: 'draft' | 'scheduled' | 'published';
  scheduled_publish_at?: Date;
  published?: boolean;
  created_by?: string;
}

// Type for updating a post
export interface UpdatePostData {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featured_image?: string;
  tags?: string[];
  author?: string;
  read_time?: number;
  date?: Date;
  permission_level?: 'all' | 'professional' | 'personal';
  status?: 'draft' | 'scheduled' | 'published';
  scheduled_publish_at?: Date;
  published?: boolean;
} 