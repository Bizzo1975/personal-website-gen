'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import MarkdownContent from '@/components/MarkdownContent';
import BackgroundSlideshow from '@/components/BackgroundSlideshow';
import CreativeCodeElement from '@/components/CreativeCodeElement';
import NewsletterSignup from '@/components/NewsletterSignup';
import { ProfileData } from '@/lib/services/profile-service';
import { Icon, IconWithText } from '@/components/IconSystem';
import { EnhancedAnimatedElement, StaggeredChildren, ScrollAnimation } from '@/components/EnhancedAnimationLibrary';

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
  heroHeading?: string;
}

export default function HomePage({ content, projects = [], blogPosts = [], heroHeading = "Building the Modern Web" }: HomePageProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile data
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setProfileData(data);
        } else {
          console.error('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      image: '/images/projects/ecommerce-platform.svg'
    },
    {
      id: '2',
      title: 'Task Management App',
      description: 'A productivity tool for managing tasks, projects, and team collaboration with real-time updates.',
      technologies: ['Next.js', 'TypeScript', 'Prisma'],
      slug: '/projects/task-management-app',
      image: '/images/projects/task-management.svg'
    },
    {
      id: '3',
      title: 'AI Image Generator',
      description: 'An application that generates images from text descriptions using AI models and APIs.',
      technologies: ['Python', 'TensorFlow', 'FastAPI'],
      slug: '/projects/ai-image-generator',
      image: '/images/projects/ai-image-generator.svg'
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
        <BackgroundSlideshow opacity={0.4} overlayOpacity={0.3} />
        
        <div className="container-modern relative z-10">
          <div className="grid md:grid-cols-12 gap-12 items-start py-16 md:py-24">
            <div className="md:col-span-7">
              <EnhancedAnimatedElement type="fadeIn" duration={0.8}>
                <h1 className="heading-display text-gradient-primary mb-6 text-balance">
                  <span className="block text-white opacity-90">{heroHeading}</span>
                </h1>
              </EnhancedAnimatedElement>
              <EnhancedAnimatedElement type="slideUp" delay={0.3}>
                <div className="prose prose-lg dark:prose-invert text-white/90 mb-8">
                  <MarkdownContent content={content} />
                </div>
              </EnhancedAnimatedElement>
              <EnhancedAnimatedElement type="slideUp" delay={0.6}>
                <div className="flex flex-wrap gap-4">
                  <IconWithText name="briefcase" iconPosition="left">
                    <Link href="/projects" className="btn-primary">
                      View My Work
                    </Link>
                  </IconWithText>
                  <IconWithText name="mail" iconPosition="left">
                    <Link href="/contact" className="btn-secondary">
                      Get In Touch
                    </Link>
                  </IconWithText>
                </div>
              </EnhancedAnimatedElement>
            </div>
            <div className="md:col-span-5 relative z-10">
              <div className="flex flex-col gap-16 items-center">
                {/* Creative code animation element */}
                <div className="backdrop-blur-md rounded-2xl rotate-3 hover:rotate-0 transition-transform duration-500 border-0 outline-0" style={{ width: '400px', height: '250px' }}>
                  <CreativeCodeElement 
                    className="rounded-2xl border-0"
                    width={400}
                    height={250}
                  />
                </div>
                
                <div className="bg-slate-800/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg p-6 rounded-2xl rotate-2 hover:rotate-0 transition-transform duration-500" style={{ width: '400px', height: '250px' }}>
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
      <ScrollAnimation type="fadeIn">
        <section className="section-modern section-enhanced bg-pattern-dots">
          <div className="container-modern relative z-10">
            <EnhancedAnimatedElement type="slideUp">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                <div className="relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-primary-500 to-primary-600 rounded-full opacity-0 animate-fade-in-left" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}></div>
                  <p className="text-primary-600 dark:text-primary-400 font-medium mb-2 flex items-center animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                    <Icon name="briefcase" size="sm" className="mr-2" />
                    PORTFOLIO
                  </p>
                  <h2 className="heading-2 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>Featured Projects</h2>
                  <div className="mt-2 w-24 h-0.5 bg-gradient-to-r from-primary-500 to-transparent opacity-0 animate-fade-in-right" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}></div>
                </div>
                <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                  <IconWithText name="arrow-right" iconPosition="right">
                    <Link href="/projects" className="btn-outline mt-4 md:mt-0 hover:scale-105 transition-transform duration-200">
                      View All Projects
                    </Link>
                  </IconWithText>
                </div>
              </div>
            </EnhancedAnimatedElement>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedProjects.map((project, index) => (
                <div 
                  key={project.id} 
                  className="card-enhanced group animate-fade-in-up opacity-0"
                  style={{ 
                    animationDelay: `${index * 150}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="img-hover-zoom h-48 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    <img 
                      src={project.image || '/images/projects/placeholder.svg'} 
                      alt={project.title}
                      width={600}
                      height={400}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 z-20">
                      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary-600 dark:text-primary-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 relative">
                    <div className="absolute top-0 left-6 w-12 h-1 bg-gradient-to-r from-primary-500 to-primary-600 transform -translate-y-1 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    <h3 className="heading-4 mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-body-small text-secondary mb-4 line-clamp-3">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech, techIndex) => (
                        <span 
                          key={tech} 
                          className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium transform transition-all duration-200 hover:scale-105 hover:bg-primary-200 dark:hover:bg-primary-800/30"
                          style={{ 
                            animationDelay: `${(index * 150) + (techIndex * 50)}ms` 
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <IconWithText name="arrow-right" iconPosition="right">
                      <Link 
                        href={project.slug || `/projects/${project.id}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-all duration-200 group-hover:translate-x-1"
                      >
                        View Project
                      </Link>
                    </IconWithText>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollAnimation>
      
      {/* Blog Posts Section */}
      <ScrollAnimation type="fadeIn">
        <section className="section-modern bg-surface-secondary section-enhanced bg-pattern-grid">
          <div className="container-modern relative z-10">
            <EnhancedAnimatedElement type="slideUp">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                <div className="relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-secondary-500 to-secondary-600 rounded-full opacity-0 animate-fade-in-left" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}></div>
                  <p className="text-primary-600 dark:text-primary-400 font-medium mb-2 flex items-center animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                    <Icon name="document-text" size="sm" className="mr-2" />
                    BLOG
                  </p>
                  <h2 className="heading-2 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>Latest Articles</h2>
                  <div className="mt-2 w-24 h-0.5 bg-gradient-to-r from-secondary-500 to-transparent opacity-0 animate-fade-in-right" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}></div>
                </div>
                <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                  <IconWithText name="arrow-right" iconPosition="right">
                    <Link href="/blog" className="btn-outline mt-4 md:mt-0 hover:scale-105 transition-transform duration-200">
                      View All Posts
                    </Link>
                  </IconWithText>
                </div>
              </div>
            </EnhancedAnimatedElement>
            
            <div className="grid md:grid-cols-2 gap-8">
              {displayedPosts.map((post, index) => (
                <article 
                  key={post.id} 
                  className="card-enhanced group animate-fade-in-up opacity-0"
                  style={{ 
                    animationDelay: `${index * 200}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="p-6 relative">
                    <div className="absolute top-0 left-6 w-16 h-1 bg-gradient-to-r from-secondary-500 to-secondary-600 transform -translate-y-1 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    <div className="flex items-center text-caption text-secondary mb-3">
                      <div className="flex items-center bg-secondary-100 dark:bg-secondary-900/20 rounded-full px-3 py-1 mr-3">
                        <Icon name="calendar" size="xs" className="mr-2" />
                        <span className="text-xs font-medium">{post.date}</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-secondary-200 to-transparent dark:from-secondary-700"></div>
                    </div>
                    <h3 className="heading-4 mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      <Link href={post.slug} className="hover:underline decoration-primary-500 decoration-2 underline-offset-4">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-body-small text-secondary mb-4 line-clamp-3 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {post.tags.map((tag, tagIndex) => (
                        <span 
                          key={tag} 
                          className="px-3 py-1 bg-secondary-100 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-300 rounded-full text-xs font-medium transform transition-all duration-200 hover:scale-105 hover:bg-secondary-200 dark:hover:bg-secondary-800/30"
                          style={{ 
                            animationDelay: `${(index * 200) + (tagIndex * 75)}ms` 
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <IconWithText name="arrow-right" iconPosition="right">
                        <Link 
                          href={post.slug} 
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-all duration-200 group-hover:translate-x-1"
                        >
                          Read More
                        </Link>
                      </IconWithText>
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <div className="bg-primary-100 dark:bg-primary-900/20 rounded-full p-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary-600 dark:text-primary-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </ScrollAnimation>

      {/* Newsletter Signup Section */}
      <ScrollAnimation type="fadeIn">
        <section className="section-modern bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
          <div className="container-modern">
            <EnhancedAnimatedElement type="slideUp">
              <NewsletterSignup
                variant="inline"
                title="Stay in the Loop"
                description="Get notified about new projects, blog posts, and insights on modern web development. Join a community of developers who are passionate about building amazing things."
                incentive="🚀 Plus exclusive tips, early access to new content, and behind-the-scenes updates"
                showSocialProof={true}
                subscriberCount={2847}
              />
            </EnhancedAnimatedElement>
          </div>
        </section>
      </ScrollAnimation>
    </div>
  );
}
