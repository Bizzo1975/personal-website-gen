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
  featuredImage?: string;
}

// Mock data for development when MongoDB is not available
const mockPosts: PostData[] = [
  {
    id: '1',
    title: 'Getting Started with Next.js and TypeScript',
    slug: 'getting-started-with-nextjs-typescript',
    date: '2023-04-15',
    readTime: 5,
    excerpt: 'Learn how to set up a Next.js project with TypeScript and build your first application with modern development practices.',
    featuredImage: '/images/blog/nextjs-typescript.svg',
    content: `
# Getting Started with Next.js and TypeScript

Next.js is a powerful framework for building React applications with server-side rendering, static site generation, and more.

## Setting up a new project

To create a new Next.js project with TypeScript, you can use the following command:

\`\`\`bash
npx create-next-app@latest my-project --typescript
\`\`\`

This will create a new directory with all the files you need to get started.

## Key features

- Server-side rendering
- Static site generation
- File-based routing
- API routes
- Built-in CSS and Sass support
- Fast refresh
- TypeScript support out of the box
    `,
    tags: ['Next.js', 'TypeScript', 'React', 'Web Development'],
    author: 'John Doe',
    published: true,
    updatedAt: new Date('2023-04-15')
  },
  {
    id: '2',
    title: 'Why I Switched to Tailwind CSS',
    slug: 'why-i-switched-to-tailwind-css',
    date: '2023-05-20',
    readTime: 7,
    excerpt: 'Discover why Tailwind CSS has revolutionized my development workflow and how it can improve your styling approach.',
    featuredImage: '/images/blog/tailwind-css.svg',
    content: `
# Why I Switched to Tailwind CSS

Tailwind CSS is a utility-first CSS framework packed with classes like flex, pt-4, text-center that can be composed to build any design, directly in your markup.

## Why Tailwind?

- No more custom CSS files
- Design system constraints
- Responsive design made easy
- Dark mode with minimal effort
- Faster development cycle

## Installation

\`\`\`bash
npm install tailwindcss
\`\`\`

Then create your configuration files:

\`\`\`bash
npx tailwindcss init
\`\`\`

## Benefits I've experienced

1. **Faster prototyping** - Build UIs directly in markup
2. **Consistent spacing** - Predefined spacing scale
3. **Mobile-first** - Easy responsive design
4. **Maintainable** - No CSS file bloat
    `,
    tags: ['CSS', 'Tailwind', 'Design', 'Development'],
    author: 'Jane Smith',
    published: true,
    updatedAt: new Date('2023-05-20')
  },
  {
    id: '3',
    title: 'React Best Practices for 2024',
    slug: 'react-best-practices-2024',
    date: '2023-06-10',
    readTime: 8,
    excerpt: 'Learn the latest React best practices, performance optimizations, and clean code techniques for modern development.',
    featuredImage: '/images/blog/react-best-practices.svg',
    content: `
# React Best Practices for 2024

As React continues to evolve, it's important to stay up-to-date with the latest best practices and patterns.

## Component Design

- Keep components small and focused
- Use custom hooks for logic reuse
- Implement proper error boundaries
- Optimize with React.memo when needed

## Performance Tips

1. **Use React.lazy** for code splitting
2. **Implement useMemo** for expensive calculations
3. **Use useCallback** for stable function references
4. **Avoid inline object creation** in JSX

## Code Organization

- Feature-based folder structure
- Consistent naming conventions
- Proper TypeScript integration
- Unit testing with Jest and RTL
    `,
    tags: ['React', 'Performance', 'Best Practices', 'JavaScript'],
    author: 'Alex Johnson',
    published: true,
    updatedAt: new Date('2023-06-10')
  },
  {
    id: '4',
    title: 'Modern Web Development Techniques',
    slug: 'modern-web-development-techniques',
    date: '2023-07-05',
    readTime: 6,
    excerpt: 'Explore cutting-edge web development techniques, tools, and methodologies that are shaping the future of the web.',
    featuredImage: '/images/blog/web-development.svg',
    content: `
# Modern Web Development Techniques

The web development landscape is constantly evolving. Here are some of the most important techniques and tools for modern development.

## Development Tools

- **Vite** - Lightning fast build tool
- **ESBuild** - Extremely fast bundler
- **Turborepo** - High-performance monorepo tool
- **Playwright** - Modern end-to-end testing

## Architecture Patterns

1. **Jamstack** - JavaScript, APIs, and Markup
2. **Micro-frontends** - Scalable frontend architecture
3. **Serverless** - Event-driven computing
4. **Edge computing** - Reduced latency

## Performance Techniques

- Core Web Vitals optimization
- Progressive Web Apps (PWA)
- Service Worker strategies
- Image optimization techniques
    `,
    tags: ['Web Development', 'Performance', 'Tools', 'Architecture'],
    author: 'Sarah Wilson',
    published: true,
    updatedAt: new Date('2023-07-05')
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
    
    return posts.map((post: any) => ({
      id: (post as any)._id.toString(),
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
      id: (post as any)._id.toString(),
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