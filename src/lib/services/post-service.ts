import dbConnect, { isMockMode } from '@/lib/db';
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

// Mock data for development when MongoDB is not available
const mockPosts: PostData[] = [
  {
    id: '1',
    title: 'Getting Started with Next.js',
    slug: 'getting-started-with-nextjs',
    date: '2023-04-15',
    readTime: 5,
    excerpt: 'Learn how to set up a Next.js project and build your first application',
    content: `
# Getting Started with Next.js

Next.js is a powerful framework for building React applications with server-side rendering, static site generation, and more.

## Setting up a new project

To create a new Next.js project, you can use the following command:

\`\`\`bash
npx create-next-app my-project
\`\`\`

This will create a new directory with all the files you need to get started.

## Key features

- Server-side rendering
- Static site generation
- File-based routing
- API routes
- Built-in CSS and Sass support
- Fast refresh
    `,
    tags: ['Next.js', 'React', 'Web Development'],
    author: 'John Doe',
    published: true,
    updatedAt: new Date('2023-04-15')
  },
  {
    id: '2',
    title: 'Mastering Tailwind CSS',
    slug: 'mastering-tailwind-css',
    date: '2023-05-20',
    readTime: 7,
    excerpt: 'Learn how to leverage Tailwind CSS to build beautiful UIs quickly',
    content: `
# Mastering Tailwind CSS

Tailwind CSS is a utility-first CSS framework packed with classes like flex, pt-4, text-center that can be composed to build any design, directly in your markup.

## Why Tailwind?

- No more custom CSS files
- Design system constraints
- Responsive design made easy
- Dark mode with minimal effort

## Installation

\`\`\`bash
npm install tailwindcss
\`\`\`

Then create your configuration files:

\`\`\`bash
npx tailwindcss init
\`\`\`
    `,
    tags: ['CSS', 'Tailwind', 'Design'],
    author: 'Jane Smith',
    published: true,
    updatedAt: new Date('2023-05-20')
  }
];

export interface PostQuery {
  published?: boolean;
  limit?: number;
  skip?: number;
  tag?: string;
  sort?: Record<string, SortOrder>;
}

// Helper function to determine if we should use mock data
const useMockData = () => {
  return isMockMode();
};

export async function getPosts(query: PostQuery = {}): Promise<PostData[]> {
  // Use mock data if MongoDB is not available
  if (useMockData()) {
    const { published = true, limit = 10, skip = 0, tag } = query;
    
    let filteredPosts = [...mockPosts];
    
    // Apply filters
    if (published !== undefined) {
      filteredPosts = filteredPosts.filter(post => post.published === published);
    }
    
    if (tag) {
      filteredPosts = filteredPosts.filter(post => post.tags.includes(tag));
    }
    
    // Apply sorting - default to newest first
    filteredPosts.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    // Apply pagination
    return filteredPosts.slice(skip, skip + limit);
  }
  
  // Otherwise, use MongoDB
  try {
    await dbConnect();
    
    const { published = true, limit = 10, skip = 0, tag, sort = { date: -1 } } = query;
    
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
    return mockPosts; // Return mock posts as fallback
  }
}

export async function getPostBySlug(slug: string): Promise<PostData | null> {
  // Use mock data if MongoDB is not available
  if (useMockData()) {
    const post = mockPosts.find(p => p.slug === slug && p.published);
    return post || null;
  }
  
  // Otherwise, use MongoDB
  try {
    await dbConnect();
    
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
    
    // Fallback to mock data
    const post = mockPosts.find(p => p.slug === slug);
    return post || null;
  }
} 