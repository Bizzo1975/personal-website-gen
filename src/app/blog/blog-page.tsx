'use client';

import '@/styles/globals.css';
import React from 'react';
import Link from 'next/link';
import Card, { CardBody } from '@/components/Card';
import Badge from '@/components/Badge';

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
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Blog</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Thoughts, tutorials, and insights on web development
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {displayedPosts.map((post) => (
          <Card key={post.id} variant="bordered" className="hover-card">
            <CardBody>
              <Link href={post.slug} className="block space-y-4">
                <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">{post.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{post.date}</p>
                <p className="text-slate-600 dark:text-slate-300">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant={index % 2 === 0 ? 'primary' : 'info'} size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}