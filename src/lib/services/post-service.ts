import dbConnect from '@/lib/db';
import Post from '@/lib/models/Post';
import { SortOrder } from 'mongoose';

export interface PostData {
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
}

export interface PostQuery {
  published?: boolean;
  limit?: number;
  skip?: number;
  tag?: string;
  sort?: Record<string, SortOrder>;
}

export async function getPosts(query: PostQuery = {}): Promise<PostData[]> {
  await dbConnect();
  
  const { published = true, limit = 10, skip = 0, tag, sort = { date: -1 } } = query;
  
  try {
    // Build query filter
    const filter: Record<string, any> = { published };
    if (tag) {
      filter.tags = { $in: [tag] };
    }
    
    // Don't populate author to avoid User model dependency
    const posts = await Post.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    return posts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      date: post.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      readTime: post.readTime,
      excerpt: post.excerpt,
      content: post.content,
      tags: post.tags,
      author: 'Anonymous', // Use placeholder instead of trying to access author name
      published: post.published,
      updatedAt: post.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<PostData | null> {
  await dbConnect();
  
  try {
    // Don't populate author to avoid User model dependency
    const post = await Post.findOne({ slug, published: true });
    if (!post) return null;
    
    return {
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      date: post.date.toISOString().split('T')[0],
      readTime: post.readTime,
      excerpt: post.excerpt,
      content: post.content,
      tags: post.tags,
      author: 'Anonymous', // Use placeholder instead of trying to access author name
      published: post.published,
      updatedAt: post.updatedAt
    };
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
} 