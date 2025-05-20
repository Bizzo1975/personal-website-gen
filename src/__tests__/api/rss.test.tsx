import { GET } from '@/app/api/rss/route';
import { getPosts } from '@/lib/services/post-service';
import { NextResponse } from 'next/server';

// Mock the post service
jest.mock('@/lib/services/post-service', () => ({
  getPosts: jest.fn(),
}));

describe('RSS Feed API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate RSS XML with the correct content type', async () => {
    // Mock the posts data
    const mockPosts = [
      {
        id: '1',
        title: 'Test Post 1',
        slug: 'test-post-1',
        date: '2023-10-15',
        readTime: 5,
        excerpt: 'This is a test post',
        content: 'Test content',
        tags: ['test', 'jest'],
        author: 'Test Author',
        published: true,
        updatedAt: new Date()
      }
    ];

    // Setup the mock
    (getPosts as jest.Mock).mockResolvedValue(mockPosts);

    // Call the API route handler
    const response = await GET();

    // Assert that getPosts was called with the correct parameters
    expect(getPosts).toHaveBeenCalledWith({
      published: true,
      limit: 20,
      sort: { date: -1 }
    });

    // Check response headers
    expect(response.headers.get('Content-Type')).toBe('application/xml');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=21600');

    // Convert the response to text
    const text = await response.text();

    // Check if the XML contains critical elements
    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(text).toContain('<rss version="2.0"');
    expect(text).toContain('<title>My Personal Website</title>');
    
    // Check if our mock post data is in the feed
    expect(text).toContain('<title>Test Post 1</title>');
    expect(text).toContain('<link>http://localhost:3000/blog/test-post-1</link>');
    expect(text).toContain('<category>test</category>');
    expect(text).toContain('<category>jest</category>');
  });
}); 