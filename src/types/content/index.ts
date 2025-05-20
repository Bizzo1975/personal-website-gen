export interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
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