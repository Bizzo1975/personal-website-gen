import { Post as DBPost, CreatePostData, UpdatePostData } from '@/lib/models/Post';
import { query } from '@/lib/db';

// Frontend Post interface with camelCase properties
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags: string[];
  author: string;
  readTime: number;
  date: Date;
  permissionLevel: 'all' | 'professional' | 'personal';
  status?: 'draft' | 'scheduled' | 'published';
  published: boolean;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// PostData interface for backward compatibility
export interface PostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  tags: string[];
  author: string;
  readTime: number;
  date: Date;
  permissionLevel: 'all' | 'professional' | 'personal';
  published: boolean;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PostService {
  // Get all published posts with permission filtering
  static async getAllPosts(userEmail?: string): Promise<Post[]> {
    try {
      let queryText = `
        SELECT 
          id,
          title,
          slug,
          content,
          excerpt,
          featured_image,
          tags,
          author,
          read_time,
          date,
          permission_level,
          published,
          status,
          featured,
          created_at,
          updated_at
        FROM posts 
        WHERE (published = true OR status = 'published')
        ORDER BY date DESC
      `;
      
      const result = await query(queryText);
      const posts = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt,
        featuredImage: row.featured_image,
        tags: row.tags || [],
        author: row.author,
        readTime: row.read_time,
        date: row.date,
        permissionLevel: row.permission_level,
        status: row.status,
        published: row.published,
        featured: row.featured || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      // Filter by user permissions if userEmail is provided
      if (userEmail) {
        return await this.filterPostsByPermissions(posts, userEmail);
      }

      // Return only public posts if no user context
      return posts.filter(post => post.permissionLevel === 'all');
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      throw new Error('Failed to fetch posts from database');
    }
  }

  // Get a single post by ID
  static async getPostById(id: string): Promise<Post | null> {
    try {
      const result = await query(
        'SELECT * FROM posts WHERE id = $1',
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
        content: row.content,
        excerpt: row.excerpt,
        featuredImage: row.featured_image,
        tags: row.tags || [],
        author: row.author,
        readTime: row.read_time,
        date: row.date,
        permissionLevel: row.permission_level,
        status: row.status,
        published: row.published,
        featured: row.featured || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Failed to fetch post by ID:', error);
      throw new Error('Failed to fetch post by ID from database');
    }
  }

  // Get a single post by slug
  static async getPostBySlug(slug: string, userEmail?: string): Promise<Post | null> {
    try {
      const result = await query(
        'SELECT * FROM posts WHERE slug = $1 AND (status = $2 OR published = true)',
        [slug, 'published']
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const post: Post = {
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt,
        featuredImage: row.featured_image,
        tags: row.tags || [],
        author: row.author,
        readTime: row.read_time,
        date: row.date,
        permissionLevel: row.permission_level,
        status: row.status,
        published: row.published,
        featured: row.featured || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      // Check if user has permission to view this post
      if (post.permissionLevel !== 'all' && !userEmail) {
        return null;
      }

      if (post.permissionLevel !== 'all' && userEmail) {
        const hasPermission = await this.checkUserPermission(userEmail, post.permissionLevel);
        if (!hasPermission) {
          return null;
        }
      }

      return post;
    } catch (error) {
      console.error('Failed to fetch post by slug:', error);
      throw new Error('Failed to fetch post from database');
    }
  }

  // Get a single post by slug for admin preview (includes draft content)
  static async getPostBySlugForPreview(slug: string): Promise<Post | null> {
    try {
      const result = await query(
        'SELECT * FROM posts WHERE slug = $1',
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
        content: row.content,
        excerpt: row.excerpt,
        featuredImage: row.featured_image,
        tags: row.tags || [],
        author: row.author,
        readTime: row.read_time,
        date: row.date,
        permissionLevel: row.permission_level,
        status: row.status,
        published: row.published,
        featured: row.featured || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Failed to fetch post by slug for preview:', error);
      throw new Error('Failed to fetch post from database');
    }
  }

  // Get posts by category
  static async getPostsByCategory(category: string, userEmail?: string): Promise<Post[]> {
    try {
      const result = await query(
        'SELECT * FROM posts WHERE $1 = ANY(tags) AND published = true ORDER BY date DESC',
        [category]
      );

      const posts = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt,
        featuredImage: row.featured_image,
        tags: row.tags || [],
        author: row.author,
        readTime: row.read_time,
        date: row.date,
        permissionLevel: row.permission_level,
        published: row.published,
        featured: row.featured || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      if (userEmail) {
        return await this.filterPostsByPermissions(posts, userEmail);
      }

      return posts.filter(post => post.permissionLevel === 'all');
    } catch (error) {
      console.error('Failed to fetch posts by category:', error);
      throw new Error('Failed to fetch posts by category from database');
    }
  }

  // Create a new post (admin only)
  static async createPost(postData: CreatePostData, createdBy: string): Promise<Post> {
    try {
      const result = await query(
        `INSERT INTO posts (
          title, slug, content, excerpt, featured_image, tags, 
          author, read_time, date, permission_level, published, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING *`,
        [
          postData.title,
          postData.slug,
          postData.content,
          postData.excerpt,
          postData.featured_image,
          postData.tags,
          postData.author,
          postData.read_time,
          postData.date,
          postData.permission_level || 'all',
          postData.published || false,
          createdBy
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt,
        featuredImage: row.featured_image,
        tags: row.tags || [],
        author: row.author,
        readTime: row.read_time,
        date: row.date,
        permissionLevel: row.permission_level,
        published: row.published,
        featured: row.featured || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Failed to create post:', error);
      throw new Error('Failed to create post in database');
    }
  }

  // Update a post (admin only)
  static async updatePost(id: string, postData: UpdatePostData): Promise<Post> {
    try {
      const result = await query(
        `UPDATE posts 
           SET title = $1, slug = $2, content = $3, excerpt = $4, featured_image = $5, 
               tags = $6, author = $7, read_time = $8, date = $9, permission_level = $10, 
               published = $11, status = $12, featured = $13, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $14 
           RETURNING *`,
          [
            postData.title,
            postData.slug,
            postData.content,
            postData.excerpt,
            postData.featured_image,
            postData.tags,
            postData.author,
            postData.read_time,
            postData.date,
            postData.permission_level,
            postData.published,
            postData.status,
            postData.featured,
            id
          ]
        );

      if (result.rows.length === 0) {
        throw new Error('Post not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt,
        featuredImage: row.featured_image,
        tags: row.tags || [],
        author: row.author,
        readTime: row.read_time,
        date: row.date,
        permissionLevel: row.permission_level,
        status: row.status,
        published: row.published,
        featured: row.featured || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Failed to update post:', error);
      throw new Error('Failed to update post in database');
    }
  }

  // Delete a post (admin only)
  static async deletePost(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM posts WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw new Error('Failed to delete post from database');
    }
  }

  // Get all posts for admin (including unpublished)
  static async getAllPostsForAdmin(): Promise<Post[]> {
    try {
      const result = await query(
        'SELECT * FROM posts ORDER BY created_at DESC'
      );

      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt,
        featuredImage: row.featured_image,
        tags: row.tags || [],
        author: row.author,
        readTime: row.read_time,
        date: row.date,
        permissionLevel: row.permission_level,
        status: row.status,
        published: row.published,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Failed to fetch posts for admin:', error);
      throw new Error('Failed to fetch posts for admin from database');
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

  // Helper method to filter posts by user permissions
  private static async filterPostsByPermissions(posts: Post[], userEmail: string): Promise<Post[]> {
    try {
      const result = await query(
        'SELECT has_professional_access, has_personal_access FROM user_access_levels WHERE email = $1 AND is_active = true',
        [userEmail]
      );

      if (result.rows.length === 0) {
        // User has no special access, return only public posts
        return posts.filter(post => post.permissionLevel === 'all');
      }

      const { has_professional_access, has_personal_access } = result.rows[0];

      return posts.filter(post => {
        if (post.permissionLevel === 'all') return true;
        if (post.permissionLevel === 'professional' && has_professional_access) return true;
        if (post.permissionLevel === 'personal' && has_personal_access) return true;
        return false;
      });
    } catch (error) {
      console.error('Failed to filter posts by permissions:', error);
      // Return only public posts on error
      return posts.filter(post => post.permissionLevel === 'all');
    }
  }
}

// PostData interface for backward compatibility
export interface PostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  tags: string[];
  author: string;
  readTime: number;
  date: Date;
  permissionLevel: 'all' | 'professional' | 'personal';
  published: boolean;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Simple function exports for backward compatibility
export interface GetPostsOptions {
  limit?: number;
  category?: string;
  userEmail?: string;
}

export async function getPosts(options: GetPostsOptions = {}): Promise<PostData[]> {
  try {
    const { limit, category, userEmail } = options;
    
    let posts: Post[];
    
    if (category) {
      posts = await PostService.getPostsByCategory(category, userEmail);
    } else {
      posts = await PostService.getAllPosts(userEmail);
    }
    
    // Apply limit if specified
    if (limit && limit > 0) {
      posts = posts.slice(0, limit);
    }
    
    // Convert to PostData format
    return posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      featuredImage: post.featuredImage,
      tags: post.tags,
      author: post.author,
      readTime: post.readTime,
      date: post.date,
      permissionLevel: post.permissionLevel,
      published: post.published,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));
  } catch (error) {
    console.error('Error in getPosts:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string, userEmail?: string): Promise<PostData | null> {
  try {
    const post = await PostService.getPostBySlug(slug, userEmail);
    if (!post) return null;
    
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      featuredImage: post.featuredImage,
      tags: post.tags,
      author: post.author,
      readTime: post.readTime,
      date: post.date,
      permissionLevel: post.permissionLevel,
      published: post.published,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };
  } catch (error) {
    console.error('Error in getPostBySlug:', error);
    return null;
  }
} 
