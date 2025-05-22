'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import MarkdownContent from '@/components/MarkdownContent';
import FallbackImage from '@/components/FallbackImage';
import BackgroundSlideshow from '@/components/BackgroundSlideshow';
import { CreativeCodeElement } from '@/components';
import { ProfileData } from '@/lib/services/profile-service';

interface HomePageProps {
  content: MDXRemoteSerializeResult | any;
  projects?: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    image?: string;
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
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        } else {
          console.error('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Default skills to use if profile data is not available
  const defaultSkills = ['React', 'Next.js', 'TypeScript', 'Node.js', 'TailwindCSS', 'MongoDB'];
  
  // Use skills from profile data or fallback to default skills
  const skills = profileData?.skills || defaultSkills;

  // Default projects if none provided from database
  const defaultProjects = [
    {
      id: '1',
      title: 'E-Commerce Platform',
      description: 'A full-featured online store with payment integration, user authentication, and admin dashboard.',
      technologies: ['React', 'Node.js', 'MongoDB'],
      slug: '/projects/ecommerce-platform',
      image: '/images/projects/ecommerce-platform.jpg'
    },
    {
      id: '2',
      title: 'Task Management App',
      description: 'A productivity tool for managing tasks, projects, and team collaboration with real-time updates.',
      technologies: ['Next.js', 'tRPC', 'Prisma'],
      slug: '/projects/task-management-app',
      image: '/images/projects/task-management.jpg'
    },
    {
      id: '3',
      title: 'AI Image Generator',
      description: 'An application that generates images from text descriptions using AI models and APIs.',
      technologies: ['Python', 'TensorFlow', 'FastAPI'],
      slug: '/projects/ai-image-generator',
      image: '/images/projects/ai-image-generator.jpg'
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
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="section-hero text-white relative">
        {/* Slideshow background */}
        <BackgroundSlideshow opacity={0.5} overlayOpacity={0.2} />
        
        <div className="container-modern relative z-10">
          <div className="grid md:grid-cols-12 gap-12 items-start py-16 md:py-24">
            <div className="md:col-span-7">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
                <span className="block text-white opacity-90">Building the Modern Web</span>
              </h1>
              <div className="prose prose-lg dark:prose-invert text-white/90 mb-8">
                <MarkdownContent content={content} />
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/projects" className="btn-primary">
                  View My Work
                </Link>
                <Link href="/contact" className="btn-secondary">
                  Get In Touch
                </Link>
              </div>
            </div>
            <div className="md:col-span-5 relative z-10">
              <div className="flex flex-col gap-16 items-center">
                {/* Creative code animation element */}
                <div>
                  <CreativeCodeElement width={400} height={250} className="w-full transform rotate-3 hover:rotate-0 transition-transform duration-500" />
                </div>
                
                <div className="glass-card p-6 rounded-2xl rotate-2 hover:rotate-0 transition-transform duration-500 bg-slate-800/90 dark:bg-slate-900/90" style={{ width: '400px', height: '250px' }}>
                  <div className="text-white mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1 text-blue-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                    </svg>
                    <h3 className="text-xl font-semibold text-white">Expert Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-blue-600/80 rounded-full text-sm font-medium text-white">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Projects Section */}
      <section className="section-modern">
        <div className="container-modern">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">PORTFOLIO</p>
              <h2 className="text-3xl md:text-4xl font-bold">Featured Projects</h2>
            </div>
            <Link href="/projects" className="btn-outline mt-4 md:mt-0">
              View All Projects
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedProjects.map((project, index) => (
              <div key={project.id} className="card-project group">
                <div className="img-hover-zoom h-48 relative">
                  <FallbackImage
                    src={project.image || '/images/projects/placeholder.jpg'}
                    alt={project.title}
                    width={600}
                    height={400}
                    className="w-full h-full object-cover"
                    fallbackSrc="/images/projects/placeholder.jpg"
                    priority={index < 2}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="flex gap-2">
                      {project.technologies.slice(0, 2).map((tech, idx) => (
                        <span key={idx} className="text-xs text-white bg-white/20 px-2 py-1 rounded-full">
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 2 && (
                        <span className="text-xs text-white bg-white/20 px-2 py-1 rounded-full">
                          +{project.technologies.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  <Link 
                    href={project.slug || '#'} 
                    className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    View Project
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Blog Posts Section */}
      <section className="section-modern bg-slate-50 dark:bg-slate-800/20">
        <div className="container-modern">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">INSIGHTS</p>
              <h2 className="text-3xl md:text-4xl font-bold">Latest Articles</h2>
            </div>
            <Link href="/blog" className="btn-outline mt-4 md:mt-0">
              View All Posts
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {displayedPosts.map((post) => (
              <div key={post.id} className="card-blog bg-white dark:bg-slate-800">
                <div className="p-6 sm:p-8">
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{post.date}</p>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{post.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {post.excerpt}
                  </p>
                  
                  <Link 
                    href={post.slug} 
                    className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Read Article
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
