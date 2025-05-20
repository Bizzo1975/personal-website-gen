import React from 'react';
import { render, screen } from '@testing-library/react';
import BlogPostItem from '@/app/(main)/blog/blog-post-item';
import { PostData } from '@/lib/services/post-service';

// Mock Next.js Link component with proper types
jest.mock('next/link', () => {
  // Use a properly typed mock function
  return function MockNextLink({ 
    href, 
    children, 
    className, 
    'aria-label': ariaLabel 
  }: { 
    href: string; 
    children: React.ReactNode; 
    className?: string; 
    'aria-label'?: string 
  }) {
    return (
      <a href={href} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  };
});

// Extend PostData type to include test-specific fields
interface TestPostData extends Omit<PostData, 'updatedAt'> {
  image?: string;
  categories?: string[];
  updatedAt?: string | Date; // Allow string or Date for flexibility in tests
}

describe('BlogPostItem Component', () => {
  // Sample blog post data for testing
  const mockPost: TestPostData = {
    id: 'test-post-123',
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    date: '2025-05-20',
    excerpt: 'This is a test blog post excerpt for testing purposes',
    content: 'Full blog post content here',
    author: 'Test Author',
    tags: ['react', 'nextjs', 'testing'],
    published: true,
    readTime: 5,
    image: '/images/blog/test-post.jpg',
    categories: ['frontend'],
    updatedAt: new Date('2025-05-20').toISOString()
  };
  
  it('renders the blog post correctly', () => {
    render(<BlogPostItem post={mockPost as unknown as PostData} />);
    
    // Check title
    expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
    
    // Check date and read time
    expect(screen.getByText('2025-05-20')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    
    // Check excerpt
    expect(screen.getByText('This is a test blog post excerpt for testing purposes')).toBeInTheDocument();
    
    // Check tags
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('nextjs')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
    
    // Check "Read more" link
    const readMoreLink = screen.getByText(/Read more/i);
    expect(readMoreLink).toBeInTheDocument();
    expect(readMoreLink.closest('a')).toHaveAttribute('href', '/blog/test-blog-post');
  });
  
  it('renders the correct link URLs', () => {
    render(<BlogPostItem post={mockPost as unknown as PostData} />);
    
    // Check title link
    const titleLink = screen.getByText('Test Blog Post').closest('a');
    expect(titleLink).toHaveAttribute('href', '/blog/test-blog-post');
    
    // Check "Read more" link
    const readMoreLink = screen.getByText(/Read more/i).closest('a');
    expect(readMoreLink).toHaveAttribute('href', '/blog/test-blog-post');
  });
  
  it('has proper accessibility attributes', () => {
    render(<BlogPostItem post={mockPost as unknown as PostData} />);
    
    // Check aria-label for Read more link
    const readMoreLink = screen.getByText(/Read more/i).closest('a');
    expect(readMoreLink).toHaveAttribute('aria-label', 'Read more about Test Blog Post');
  });
});
