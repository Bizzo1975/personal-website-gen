'use client';

import React from 'react';
import Link from 'next/link';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import MarkdownContent from '@/components/MarkdownContent';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

interface HomePageProps {
  content: MDXRemoteSerializeResult | any;
  // Additional properties could be added here for projects and blog posts
  projects?: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    link?: string;
    slug?: string;
  }[];
  blogPosts?: {
    id: string;
    title: string;
    date: string;
    excerpt: string;
    tags: string[];
    slug: string;
  }[];
}

export default function HomePage({ content, projects = [], blogPosts = [] }: HomePageProps) {
  // Default projects if none provided from database
  const defaultProjects = [
    {
      id: '1',
      title: 'E-Commerce Platform',
      description: 'A full-featured online store with payment integration, user authentication, and admin dashboard.',
      technologies: ['React', 'Node.js', 'MongoDB'],
      slug: '/projects/ecommerce-platform'
    },
    {
      id: '2',
      title: 'Task Management App',
      description: 'A productivity tool for managing tasks, projects, and team collaboration with real-time updates.',
      technologies: ['Next.js', 'tRPC', 'Prisma'],
      slug: '/projects/task-management-app'
    },
    {
      id: '3',
      title: 'AI Image Generator',
      description: 'An application that generates images from text descriptions using AI models and APIs.',
      technologies: ['Python', 'TensorFlow', 'FastAPI'],
      slug: '/projects/ai-image-generator'
    }
  ];

  // Default blog posts if none provided from database
  const defaultBlogPosts = [
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

  // Use provided projects/posts or default to our samples
  const displayedProjects = projects.length > 0 ? projects : defaultProjects;
  const displayedPosts = blogPosts.length > 0 ? blogPosts : defaultBlogPosts;

  return (
    <div className="space-y-16">
      <section className="py-16 px-4 lg:px-0 max-w-4xl mx-auto">
        {/* Render the markdown content from MongoDB */}
        <MarkdownContent content={content} />
      </section>
      
      <section className="py-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Projects</h2>
            <Button href="/projects" variant="outline" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProjects.map((project) => (
              <Card key={project.id} variant="elevated" className="hover-card">
                <CardHeader>
                  <h3 className="text-xl font-semibold">{project.title}</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, index) => (
                        <Badge key={index} variant={index % 3 === 0 ? 'primary' : index % 3 === 1 ? 'secondary' : 'info'}>
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-2">
                      <Link 
                        href={project.slug || '#'} 
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                      >
                        View Project →
                      </Link>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Recent Blog Posts</h2>
            <Button href="/blog" variant="outline" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedPosts.map((post) => (
              <Card key={post.id} variant="bordered" className="hover-card">
                <CardBody>
                  <Link href={post.slug} className="block space-y-4">
                    <h3 className="text-xl font-semibold text-primary-600 dark:text-primary-400">{post.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{post.date}</p>
                    <p className="text-slate-600 dark:text-slate-300">
                      {post.excerpt}
                    </p>
                    <div className="flex gap-2">
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
      </section>
    </div>
  );
}
