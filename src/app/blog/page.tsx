'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BlogSearch from '@/components/BlogSearch';

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter blog posts based on search query
  const filteredPosts = searchQuery
    ? blogPosts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : blogPosts;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      
      <BlogSearch onSearch={setSearchQuery} />
      
      {searchQuery && (
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          {filteredPosts.length === 0 
            ? `No results found for "${searchQuery}"`
            : `Found ${filteredPosts.length} result${filteredPosts.length === 1 ? '' : 's'} for "${searchQuery}"`}
        </p>
      )}
      
      {filteredPosts.length === 0 && !searchQuery ? (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">No blog posts found.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {filteredPosts.map((post, index) => (
            <article key={index} className="border dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800">
              <h2 className="text-2xl font-semibold mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                  {post.title}
                </Link>
              </h2>
              <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
                <span>{post.date}</span>
                <span className="mx-2">&bull;</span>
                <span>{post.readTime} min read</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {post.excerpt}
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, tagIndex) => (
                  <span 
                    key={tagIndex} 
                    className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <Link 
                  href={`/blog/${post.slug}`} 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Read more &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const blogPosts = [
  {
    title: 'Getting Started with Next.js and TypeScript',
    slug: 'getting-started-with-nextjs-and-typescript',
    date: 'November 15, 2023',
    readTime: 5,
    excerpt: 'Learn how to set up a new project with Next.js and TypeScript from scratch, and discover best practices for structuring your application.',
    tags: ['Next.js', 'TypeScript', 'React']
  },
  {
    title: 'Why I Switched to Tailwind CSS',
    slug: 'why-i-switched-to-tailwind-css',
    date: 'October 28, 2023',
    readTime: 4,
    excerpt: 'After years of using traditional CSS and CSS-in-JS solutions, I made the switch to Tailwind CSS. Here\'s why I think it\'s a game-changer.',
    tags: ['CSS', 'Tailwind CSS', 'Web Development']
  },
  {
    title: 'Building a Blog with MDX and Next.js',
    slug: 'building-a-blog-with-mdx-and-nextjs',
    date: 'October 12, 2023',
    readTime: 7,
    excerpt: 'A step-by-step guide on how to create a blog using MDX for content and Next.js for the frontend, with code examples and explanations.',
    tags: ['Next.js', 'MDX', 'Blog']
  },
  {
    title: 'Optimizing Performance in React Applications',
    slug: 'optimizing-performance-in-react-applications',
    date: 'September 25, 2023',
    readTime: 6,
    excerpt: 'Practical tips and techniques for improving the performance of your React applications, from code splitting to memoization.',
    tags: ['React', 'Performance', 'JavaScript']
  },
  {
    title: 'Introduction to TypeScript for JavaScript Developers',
    slug: 'introduction-to-typescript-for-javascript-developers',
    date: 'September 10, 2023',
    readTime: 8,
    excerpt: 'A beginner-friendly introduction to TypeScript for developers who are already familiar with JavaScript, covering key concepts and benefits.',
    tags: ['TypeScript', 'JavaScript', 'Web Development']
  }
]; 