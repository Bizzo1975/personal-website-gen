'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';

// Mock blog post data (will be replaced with API calls)
const mockPosts = [
  {
    id: '1',
    title: 'Getting Started with Next.js and TypeScript',
    slug: 'getting-started-with-nextjs-and-typescript',
    date: '2023-11-15',
    excerpt: 'Learn how to set up a new project with Next.js and TypeScript from scratch...',
    readTime: 5,
    published: true,
    tags: ['Next.js', 'TypeScript', 'React']
  },
  {
    id: '2',
    title: 'Why I Switched to Tailwind CSS',
    slug: 'why-i-switched-to-tailwind-css',
    date: '2023-10-28',
    excerpt: 'After years of using traditional CSS and CSS-in-JS solutions...',
    readTime: 4,
    published: true,
    tags: ['CSS', 'Tailwind CSS', 'Web Development']
  },
  {
    id: '3',
    title: 'Building a Blog with MDX and Next.js (Draft)',
    slug: 'building-a-blog-with-mdx-and-nextjs',
    date: '2023-10-12',
    excerpt: 'A step-by-step guide on how to create a blog using MDX for content...',
    readTime: 7,
    published: false,
    tags: ['Next.js', 'MDX', 'Blog']
  },
];

export default function AdminPostsPage() {
  const [posts, setPosts] = useState(mockPosts);
  const [filter, setFilter] = useState('all'); // 'all', 'published', 'drafts'
  
  // Filter posts based on the current filter
  const filteredPosts = filter === 'all' 
    ? posts 
    : filter === 'published' 
      ? posts.filter(post => post.published) 
      : posts.filter(post => !post.published);

  // Function to handle post deletion
  const handleDeletePost = (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts(posts.filter(post => post.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your blog posts</p>
        </div>
        <Button href="/admin/posts/new">Create New Post</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'all'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'published'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setFilter('drafts')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'drafts'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Drafts
          </button>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">
              No posts found. Create a new post to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} variant="default" className="overflow-hidden">
                <CardBody>
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{post.title}</h2>
                        {!post.published && (
                          <Badge variant="warning" size="sm">Draft</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(post.date).toLocaleDateString()} • {post.readTime} min read
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">{post.excerpt}</p>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" size="sm">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col justify-end gap-2">
                      <Link 
                        href={`/admin/posts/${post.id}`}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 px-3 py-1 rounded text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 