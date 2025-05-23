import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BlogPage from '@/app/blog/blog-page';

// Mock the next/link component
jest.mock('next/link', () => {
  return ({ children, href, ...rest }: any) => {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

// Mock AnimatedElement to simplify testing
jest.mock('@/components/AnimatedElement', () => {
  return ({ children, ...props }: any) => {
    return <div data-testid="animated-element" {...props}>{children}</div>;
  };
});

describe('BlogPage Integration Test', () => {
  const mockPosts = [
    {
      id: 'test-1',
      title: 'Test Post 1',
      date: '2023-01-01',
      excerpt: 'This is test post 1',
      tags: ['testing', 'jest'],
      slug: '/blog/test-post-1'
    },
    {
      id: 'test-2',
      title: 'Test Post 2',
      date: '2023-01-02',
      excerpt: 'This is test post 2',
      tags: ['react', 'nextjs'],
      slug: '/blog/test-post-2'
    }
  ];

  test('renders blog posts correctly', () => {
    render(<BlogPage posts={mockPosts} />);
    
    // Check page title
    expect(screen.getByText('Blog')).toBeInTheDocument();
    
    // Check posts are rendered
    expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    
    // Check post content
    expect(screen.getByText('This is test post 1')).toBeInTheDocument();
    expect(screen.getByText('This is test post 2')).toBeInTheDocument();
  });

  test('renders correct number of tags', () => {
    render(<BlogPage posts={mockPosts} />);
    
    // Check tags for post 1
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.getByText('jest')).toBeInTheDocument();
    
    // Check tags for post 2
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('nextjs')).toBeInTheDocument();
  });

  test('renders RSS feed link', () => {
    render(<BlogPage posts={mockPosts} />);
    
    // Find RSS feed link
    const rssLink = screen.getByText('RSS');
    expect(rssLink).toBeInTheDocument();
    expect(rssLink.closest('a')).toHaveAttribute('href', '/api/rss');
  });

  test('renders default posts when no posts are provided', () => {
    render(<BlogPage posts={[]} />);
    
    // Should render default posts
    expect(screen.getByText('Getting Started with Next.js')).toBeInTheDocument();
    expect(screen.getByText('10 Tailwind CSS Tips for Better Designs')).toBeInTheDocument();
  });
}); 