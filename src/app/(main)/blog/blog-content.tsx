'use client';

import React from 'react';
import Link from 'next/link';
import { PostData } from '@/lib/services/post-service';
import { PageData } from '@/lib/services/page-service';
import HeaderSection from '@/components/HeaderSection';
import FallbackImage from '@/components/FallbackImage';

// Extended post type to include the fields needed for our UI
interface ExtendedPost extends Omit<PostData, 'author'> {
  coverImage?: string;
  featuredImage?: string;
  author: {
    name: string;
    image: string;
  } | string;
}

interface BlogContentProps {
  posts: PostData[];
  pageData?: PageData | null;
}

export default function BlogContent({ posts = [], pageData }: BlogContentProps) {
  // Default blog posts with our UI-specific fields
  const defaultPosts: ExtendedPost[] = [
    {
      id: '1',
      title: 'Getting Started with Next.js and TypeScript',
      slug: 'getting-started-with-nextjs-typescript',
      excerpt: 'Learn how to build modern websites with Next.js and TypeScript, from setup to deployment.',
      date: '2023-01-15',
      content: '',
      readTime: 5,
      tags: ['Next.js', 'TypeScript'],
      author: {
        name: 'John Doe',
        image: '/images/placeholder.jpg'
      },
      coverImage: '/images/blog/nextjs-typescript.svg',
      featuredImage: '/images/blog/nextjs-typescript.svg',
      published: true,
      updatedAt: new Date('2023-01-15')
    },
    {
      id: '2',
      title: 'Why I Switched to Tailwind CSS',
      slug: 'why-i-switched-to-tailwind-css',
      excerpt: 'Discover why Tailwind CSS has revolutionized my development workflow and how it can improve your styling approach.',
      date: '2023-02-03',
      content: '',
      readTime: 4,
      tags: ['CSS', 'Tailwind'],
      author: {
        name: 'John Doe',
        image: '/images/placeholder.jpg'
      },
      coverImage: '/images/blog/tailwind-css.svg',
      featuredImage: '/images/blog/tailwind-css.svg',
      published: true,
      updatedAt: new Date('2023-02-03')
    },
    {
      id: '3',
      title: 'React Best Practices for 2024',
      slug: 'react-best-practices-2024',
      excerpt: 'Learn the latest React best practices, performance optimizations, and clean code techniques for modern development.',
      date: '2023-03-20',
      content: '',
      readTime: 6,
      tags: ['React', 'Best Practices'],
      author: {
        name: 'John Doe',
        image: '/images/placeholder.jpg'
      },
      coverImage: '/images/blog/react-best-practices.svg',
      featuredImage: '/images/blog/react-best-practices.svg',
      published: true,
      updatedAt: new Date('2023-03-20')
    },
    {
      id: '4',
      title: 'Modern Web Development Techniques',
      slug: 'modern-web-development-techniques',
      excerpt: 'Explore cutting-edge web development techniques, tools, and methodologies that are shaping the future of the web.',
      date: '2023-04-10',
      content: '',
      readTime: 7,
      tags: ['Web Development', 'Modern'],
      author: {
        name: 'John Doe',
        image: '/images/placeholder.jpg'
      },
      coverImage: '/images/blog/web-development.svg',
      featuredImage: '/images/blog/web-development.svg',
      published: true,
      updatedAt: new Date('2023-04-10')
    }
  ];

  // Use provided posts or default to our samples
  const displayedPosts = posts.length > 0 
    ? posts.map(post => {
        // Use featuredImage if available, otherwise fallback to a slideshow image
        const imageUrl = (post as any).featuredImage || `/images/slideshow/coding-${Math.floor(Math.random() * 5) + 1}.jpg`;
        
        return {
          ...post,
          coverImage: imageUrl,
          featuredImage: imageUrl,
          author: typeof post.author === 'string' 
            ? { name: post.author, image: '/images/placeholder.jpg' }
            : post.author
        };
      })
    : defaultPosts;
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <HeaderSection 
        title={pageData?.headerTitle || "Blog & Articles"}
        subtitle={pageData?.headerSubtitle || "Thoughts, tutorials, and insights on web development, design, and technology."}
        showSlideshow={true}
        className="bg-gradient-secondary"
        compact={true}
      />
      
      {/* Blog Posts */}
      <section className="section-modern">
        <div className="container-modern">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {displayedPosts.map((post) => (
              <article key={post.id} className="group flex flex-col bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                {/* Featured Image */}
                <div className="h-48 overflow-hidden">
                  <FallbackImage
                    src={post.coverImage || '/images/slideshow/coding-1.jpg'}
                    alt={post.title}
                    width={600}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fallbackSrc="/images/slideshow/coding-1.jpg"
                  />
                </div>
                
                {/* Post Content */}
                <div className="p-6 flex flex-col flex-grow">
                  {/* Tags & Date */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.tags && post.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <time className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(post.date)}
                    </time>
                  </div>
                  
                  {/* Title & Excerpt */}
                  <h2 className="text-xl font-bold mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Link href={`/blog/${post.slug}`} className="block">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-5 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  {/* Author & Read More */}
                  <div className="mt-auto flex items-center justify-between">
                    {typeof post.author === 'object' && post.author.name && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                          <FallbackImage
                            src={post.author.image || '/images/placeholder.jpg'}
                            alt={post.author.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            fallbackSrc="/images/placeholder.jpg"
                          />
                        </div>
                        <span className="text-sm font-medium">{post.author.name}</span>
                      </div>
                    )}
                    
                    {typeof post.author === 'string' && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                          <FallbackImage
                            src="/images/placeholder.jpg"
                            alt={post.author}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            fallbackSrc="/images/placeholder.jpg"
                          />
                        </div>
                        <span className="text-sm font-medium">{post.author}</span>
                      </div>
                    )}
                    
                    <Link 
                      href={`/blog/${post.slug}`} 
                      className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Read More
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 