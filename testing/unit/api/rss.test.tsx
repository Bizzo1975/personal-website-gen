import { GET } from '@/app/api/rss/route';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/services/post-service', () => ({
  getAllPosts: jest.fn(),
}));

jest.mock('@/lib/services/site-service', () => ({
  getSiteSettings: jest.fn(),
}));

describe('/api/rss Route Handler', () => {
  const mockGetAllPosts = require('@/lib/services/post-service').getAllPosts;
  const mockGetSiteSettings = require('@/lib/services/site-service').getSiteSettings;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockGetSiteSettings.mockResolvedValue({
      siteName: 'Test Site',
      siteDescription: 'Test Description',
      siteUrl: 'http://localhost:3006'
    });
  });

  it('should generate RSS feed with posts', async () => {
    const mockPosts = [
      {
        slug: 'test-post-1',
        title: 'Test Post 1',
        excerpt: 'Test excerpt 1',
        content: 'Test content 1',
        publishedAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      {
        slug: 'test-post-2', 
        title: 'Test Post 2',
        excerpt: 'Test excerpt 2',
        content: 'Test content 2',
        publishedAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      }
    ];

    mockGetAllPosts.mockResolvedValue(mockPosts);

    const request = new NextRequest('http://localhost:3006/api/rss');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');

    const text = await response.text();
    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(text).toContain('<rss version="2.0">');
    expect(text).toContain('<title>Test Site</title>');
    expect(text).toContain('<description>Test Description</description>');
    expect(text).toContain('<link>http://localhost:3006</link>');
    expect(text).toContain('<title>Test Post 1</title>');
    expect(text).toContain('<link>http://localhost:3006/blog/test-post-1</link>');
    expect(text).toContain('<title>Test Post 2</title>');
    expect(text).toContain('<link>http://localhost:3006/blog/test-post-2</link>');
  });

  it('should generate RSS feed with no posts', async () => {
    mockGetAllPosts.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3006/api/rss');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');

    const text = await response.text();
    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(text).toContain('<rss version="2.0">');
    expect(text).toContain('<title>Test Site</title>');
    expect(text).toContain('<description>Test Description</description>');
    expect(text).toContain('<link>http://localhost:3006</link>');
    expect(text).not.toContain('<item>');
  });

  it('should handle errors gracefully', async () => {
    mockGetAllPosts.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3006/api/rss');
    
    await expect(GET(request)).rejects.toThrow('Database error');
  });

  it('should use correct RSS format', async () => {
    const mockPosts = [
      {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'Test excerpt',
        content: 'Test content',
        publishedAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    ];

    mockGetAllPosts.mockResolvedValue(mockPosts);

    const request = new NextRequest('http://localhost:3006/api/rss');
    const response = await GET(request);

    const text = await response.text();
    
    // Check RSS structure
    expect(text).toContain('<channel>');
    expect(text).toContain('</channel>');
    expect(text).toContain('<item>');
    expect(text).toContain('</item>');
    expect(text).toContain('<pubDate>');
    expect(text).toContain('<guid>');
  });
}); 