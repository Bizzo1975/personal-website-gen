'use client';

import '@/styles/globals.css';
import React from 'react';
import Link from 'next/link';
import Card, { CardBody } from '@/components/Card';
import Badge from '@/components/Badge';
import AnimatedElement, { createStaggeredChildren } from '@/components/AnimatedElement';

interface BlogPageProps {
  posts: {
    id: string;
    title: string;
    date: string;
    excerpt: string;
    tags: string[];
    slug: string;
  }[];
}

export default function BlogPage({ posts = [] }: BlogPageProps) {
  // Default blog posts if none provided from database
  const defaultPosts = [
    {
      id: '1',
      title: 'Getting Started with Next.js',
      date: 'January 15, 2023',
      excerpt: 'Learn how to build modern websites with Next.js, from setup to deployment.',
      tags: ['Next.js', 'Tutorial'],
      slug: '/blog/getting-started-with-nextjs'
    },
    {
      id: '2',
      title: '10 Tailwind CSS Tips for Better Designs',
      date: 'February 3, 2023',
      excerpt: 'Improve your UI design skills with these practical Tailwind CSS techniques.',
      tags: ['CSS', 'Design'],
      slug: '/blog/tailwind-css-tips'
    }
  ];

  // Use provided posts or default to samples
  const displayedPosts = posts.length > 0 ? posts : defaultPosts;

  return (
    <div className="max-w-5xl mx-auto">
      <AnimatedElement type="fadeIn" className="mb-10">
        <div className="flex items-center justify-between">
          <AnimatedElement type="slideRight" delay={0.1}>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Blog</h1>
          </AnimatedElement>
          <AnimatedElement type="slideLeft" delay={0.2}>
            <Link 
              href="/api/rss" 
              className="flex items-center text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-200"
              aria-label="RSS Feed"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
                <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm1.5 2.5c5.523 0 10 4.477 10 10a1 1 0 1 1-2 0 8 8 0 0 0-8-8 1 1 0 0 1 0-2zm0 4a6 6 0 0 1 6 6 1 1 0 1 1-2 0 4 4 0 0 0-4-4 1 1 0 0 1 0-2zm.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
              </svg>
              <span>RSS</span>
            </Link>
          </AnimatedElement>
        </div>
        <AnimatedElement type="slideUp" delay={0.3}>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Thoughts, tutorials, and insights on web development
          </p>
        </AnimatedElement>
      </AnimatedElement>
      
      <div className="grid grid-cols-1 gap-8">
        {displayedPosts.map((post, idx) => (
          <AnimatedElement 
            key={post.id} 
            type="slideUp" 
            delay={0.4 + (idx * 0.1)}
          >
            <Card 
              variant="bordered" 
              className="hover-card transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
            >
              <CardBody>
                <Link 
                  href={post.slug} 
                  className="block space-y-4 outline-none focus:ring-2 focus:ring-primary-400 rounded"
                  tabIndex={0}
                >
                  <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">{post.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{post.date}</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {post.excerpt}
                  </p>
                  <AnimatedElement type="fadeIn" delay={0.6 + (idx * 0.1)}>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant={index % 2 === 0 ? 'primary' : 'info'} 
                          size="sm"
                          className="transition-all duration-300 hover:scale-105"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </AnimatedElement>
                </Link>
              </CardBody>
            </Card>
          </AnimatedElement>
        ))}
      </div>
    </div>
  );
}