import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import BlogClientPage from '@/app/(main)/blog/blog-client-page';
import { PostData } from '@/lib/services/post-service';

// Mock the BlogPostItem component to simplify testing
jest.mock('@/app/(main)/blog/blog-post-item', () => {
  return function MockBlogPostItem({ post }: { post: PostData | TestPostData }) {
    return <div data-testid={`blog-post-${post.id}`}>{post.title}</div>;
  };
});

// Mock the BlogSearchBar component
jest.mock('@/components/BlogSearchBar', () => {
  return function MockBlogSearchBar({ onSearch, initialQuery }: { onSearch: (query: string) => void, initialQuery?: string }) {
    return (
      <div data-testid="blog-search-bar">
        <input 
          data-testid="search-input"
          type="text"
          value={initialQuery || ''}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search blog posts..."
        />
      </div>
    );
  };
});

// Extend PostData type to include test-specific fields
interface TestPostData extends Omit<PostData, 'updatedAt'> {
  image?: string;
  categories?: string[];
  updatedAt?: string | Date; // Allow string or Date for flexibility in tests
}

// Sample blog posts data
const mockPosts: TestPostData[] = [
  {
    id: 'post-1',
    title: 'React Hooks Tutorial',
    slug: 'react-hooks-tutorial',
    date: '2025-05-10',
    excerpt: 'Learn how to use React hooks in your applications',
    content: 'Full content about React hooks',
    author: 'John Doe',
    tags: ['react', 'hooks', 'javascript'],
    published: true,
    readTime: 5,
    image: '/images/blog/react-hooks.jpg',
    categories: ['frontend', 'react']
  },
  {
    id: 'post-2',
    title: 'NextJS Server Components',
    slug: 'nextjs-server-components',
    date: '2025-05-15',
    excerpt: 'Explore the benefits of NextJS server components',
    content: 'Full content about NextJS server components',
    author: 'Jane Smith',
    tags: ['nextjs', 'server-components', 'react'],
    published: true,
    readTime: 7,
    image: '/images/blog/nextjs.jpg',
    categories: ['frontend', 'nextjs']
  },
  {
    id: 'post-3',
    title: 'TypeScript Best Practices',
    slug: 'typescript-best-practices',
    date: '2025-05-18',
    excerpt: 'Improve your TypeScript code with these best practices',
    content: 'Full content about TypeScript best practices',
    author: 'Alex Johnson',
    tags: ['typescript', 'javascript', 'best-practices'],
    published: true,
    readTime: 6,
    image: '/images/blog/typescript.jpg',
    categories: ['frontend', 'typescript']
  }
];

describe('BlogClientPage Component', () => {
  const mockReplace = jest.fn();
  const mockStartTransition = jest.fn((callback) => callback());
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the Next.js navigation hooks
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace
    });
    
    // Mock React's useTransition
    jest.spyOn(React, 'useTransition').mockImplementation(() => [false, mockStartTransition]);
  });
  
  it('renders all blog posts without a search query', () => {
    // Mock empty search params
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
      toString: jest.fn().mockReturnValue('')
    });
    
    render(<BlogClientPage initialPosts={mockPosts as unknown as PostData[]} />);
    
    // Should render the page title
    expect(screen.getByText('Blog')).toBeInTheDocument();
    
    // Should render the search bar
    expect(screen.getByTestId('blog-search-bar')).toBeInTheDocument();
    
    // Should render all blog posts
    mockPosts.forEach(post => {
      expect(screen.getByTestId(`blog-post-${post.id}`)).toBeInTheDocument();
      expect(screen.getByText(post.title)).toBeInTheDocument();
    });
    
    // Should not show "No results found" message
    expect(screen.queryByText(/No results found/)).not.toBeInTheDocument();
  });
  
  it('filters posts based on URL search query', () => {
    // Mock search params with 'react' query
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation(key => key === 'q' ? 'react' : null),
      toString: jest.fn().mockReturnValue('q=react')
    });
    
    render(<BlogClientPage initialPosts={mockPosts as unknown as PostData[]} />);
    
    // Should show "Found x results" message
    expect(screen.getByText(/Found 2 results for "react"/)).toBeInTheDocument();
    
    // Should only render posts that match the search query
    expect(screen.getByTestId('blog-post-post-1')).toBeInTheDocument(); // React Hooks Tutorial
    expect(screen.getByTestId('blog-post-post-2')).toBeInTheDocument(); // NextJS Server Components (has 'react' tag)
    expect(screen.queryByTestId('blog-post-post-3')).not.toBeInTheDocument(); // TypeScript Best Practices
  });
  
  it('shows "No results found" when search has no matches', () => {
    // Mock search params with a query that has no matches
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation(key => key === 'q' ? 'vue' : null),
      toString: jest.fn().mockReturnValue('q=vue')
    });
    
    render(<BlogClientPage initialPosts={mockPosts as unknown as PostData[]} />);
    
    // Should show "No results found" message
    expect(screen.getByText(/No results found for "vue"/)).toBeInTheDocument();
    
    // Should not render any posts
    mockPosts.forEach(post => {
      expect(screen.queryByTestId(`blog-post-${post.id}`)).not.toBeInTheDocument();
    });
  });
  
  it('updates the URL when search is performed', async () => {
    // Mock empty search params initially
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
      toString: jest.fn().mockReturnValue('')
    });
    
    render(<BlogClientPage initialPosts={mockPosts as unknown as PostData[]} />);
    
    // Simulate a search
    const searchInput = screen.getByTestId('search-input');
    await userEvent.type(searchInput, 'typescript');
    
    // URL should be updated
    expect(mockReplace).toHaveBeenCalledWith('/blog?q=typescript');
  });
  
  it('shows empty state when there are no posts', () => {
    // Mock empty search params
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
      toString: jest.fn().mockReturnValue('')
    });
    
    render(<BlogClientPage initialPosts={[]} />);
    
    // Should show "No blog posts found" message
    expect(screen.getByText('No blog posts found.')).toBeInTheDocument();
  });
});
