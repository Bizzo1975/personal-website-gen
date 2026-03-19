'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FiCode } from 'react-icons/fi';
import BackgroundSlideshow from '@/components/BackgroundSlideshow';
import CreativeCodeElement from '@/components/CreativeCodeElement';
import NewsletterSignup from '@/components/NewsletterSignup';
import MarkdownContent from '@/components/MarkdownContent';
import { ProfileData } from '@/lib/services/profile-service';
import { Icon, IconWithText } from '@/components/IconSystem';
import { EnhancedAnimatedElement, ScrollAnimation } from '@/components/EnhancedAnimationLibrary';
import TiltProjectCard from '@/components/TiltProjectCard';
import MorphingBlogCard from '@/components/MorphingBlogCard';

interface HomePageProps {
  content?: any;
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
    featuredImage?: string;
  }[];
  heroHeading?: string;
  headerTitle?: string;
  headerSubtitle?: string;
}

export default function HomePage({ 
  content, 
  projects = [], 
  blogPosts = [], 
  heroHeading = "Building the Modern Web",
  headerTitle,
  headerSubtitle
}: HomePageProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Client-side mounting guard
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Default skills to use if profile data is not available
  const defaultSkills = ['React', 'Next.js', 'TypeScript', 'Node.js', 'TailwindCSS', 'Python', 'Docker', 'AWS', 'PostgreSQL', 'MongoDB', 'GraphQL', 'Redis'];
  
  // Fetch profile data from API with timeout and error handling
  useEffect(() => {
    if (!isMounted) return;
    
    const fetchData = async () => {
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Fetch profile data from public endpoint (no authentication required)
        const profileResponse = await fetch('/api/public/profile', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setProfileData(data);
        } else {
          console.warn('Failed to fetch profile data:', profileResponse.status);
          // Use default skills if API fails
          setProfileData({
            name: 'Developer',
            imageUrl: '/images/placeholder-image.png',
            skills: defaultSkills,
            homePageSkills: defaultSkills.slice(0, 6),
            location: '',
            email: '',
            socialLinks: { github: '', linkedin: '', website: '' }
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Profile data fetch timed out');
        } else {
          console.warn('Error fetching profile data:', error);
        }
        // Use default skills if API fails
        setProfileData({
          name: 'Developer',
          imageUrl: '/images/placeholder-image.png',
          skills: defaultSkills,
          homePageSkills: defaultSkills.slice(0, 6),
          location: '',
          email: '',
          socialLinks: { github: '', linkedin: '', website: '' }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isMounted]);

  // Use home page skills from profile data, fallback to all skills, then default skills
  const homePageSkills = profileData?.homePageSkills || [];
  const skills = homePageSkills.length > 0 ? homePageSkills : (profileData?.skills || defaultSkills);

  // Always show sections - allow empty states
  const displayedProjects = projects || [];
  const displayedPosts = blogPosts || [];

  // Show fallback content until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="space-y-12">
        <section className="section-hero text-white relative min-h-screen flex items-center">
          <div className="container-modern relative z-10">
            <div className="grid md:grid-cols-12 gap-12 items-start py-16 md:py-24">
              <div className="md:col-span-7">
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 text-balance leading-tight">
                  {heroHeading}
                </h1>
                {/* Header Title */}
                {headerTitle && (
                  <h2 className="text-3xl md:text-4xl font-bold text-white/95 mb-4 text-balance">
                    {headerTitle}
                  </h2>
                )}
                {/* Header Subtitle */}
                {headerSubtitle && (
                  <h3 className="text-xl md:text-2xl font-medium text-white/85 mb-8 text-balance">
                    {headerSubtitle}
                  </h3>
                )}
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
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="section-hero text-white relative">
        {/* Slideshow background - only render on client */}
        {isMounted && <BackgroundSlideshow opacity={0.4} overlayOpacity={0.3} />}
        
        <div className="container-modern relative z-10">
          <div className="grid md:grid-cols-12 gap-8 items-start py-12 md:py-16">
            <div className="md:col-span-7">
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 text-balance leading-tight">
                {heroHeading}
              </h1>
              {/* Header Title */}
              {headerTitle && (
                <EnhancedAnimatedElement type="slideUp" delay={0.2} disabled={!isMounted}>
                  <h2 className="text-3xl md:text-4xl font-bold text-white/95 mb-4 text-balance">
                    {headerTitle}
                  </h2>
                </EnhancedAnimatedElement>
              )}
              {/* Header Subtitle */}
              {headerSubtitle && (
                <EnhancedAnimatedElement type="slideUp" delay={0.25} disabled={!isMounted}>
                  <h3 className="text-xl md:text-2xl font-medium text-white/85 mb-8 text-balance">
                    {headerSubtitle}
                  </h3>
                </EnhancedAnimatedElement>
              )}
              <EnhancedAnimatedElement type="slideUp" delay={0.3} disabled={!isMounted}>
                <div className="prose prose-lg dark:prose-invert text-white/90 mb-8">
                  <MarkdownContent content={content} />
                </div>
              </EnhancedAnimatedElement>
              <EnhancedAnimatedElement type="slideUp" delay={0.6} disabled={!isMounted}>
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
              <div className="flex flex-col gap-8 items-center">
                {/* Creative code animation element - only render on client */}
                {isMounted && (
                  <div className="backdrop-blur-md rounded-2xl rotate-0 md:hover:rotate-3 transition-transform duration-500 border-0 outline-0" style={{ width: '400px', height: '250px' }}>
                    <CreativeCodeElement 
                      className="rounded-2xl border-0"
                      width={400}
                      height={250}
                    />
                  </div>
                )}
                
                {!isMounted && (
                  <div className="backdrop-blur-md rounded-2xl rotate-0 md:hover:rotate-3 transition-transform duration-500 border-0 outline-0 bg-slate-800/90 dark:bg-slate-900/90 flex items-center justify-center" style={{ width: '400px', height: '250px' }}>
                    <div className="text-white/50 text-center">
                      <div className="text-blue-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                        </svg>
                      </div>
                      <div className="text-sm">Loading...</div>
                    </div>
                  </div>
                )}
                
                <div className="bg-slate-800/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg p-4 rounded-2xl rotate-0 md:hover:rotate-2 transition-transform duration-500" style={{ width: '400px', height: '220px' }}>
                  <div className="flex items-center text-white mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-3 text-blue-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                    </svg>
                    <h3 className="text-xl font-semibold text-white">Professional Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map(skill => (
                      <span key={skill} className="px-2.5 py-0.5 bg-blue-600/80 rounded-full text-sm font-medium text-white">
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
      
      {/* Featured Projects Section - Always show */}
      <ScrollAnimation type="fadeIn">
        <section className="py-6 md:py-8 section-enhanced bg-pattern-dots">
          <div className="container-modern relative z-10">
            <EnhancedAnimatedElement type="slideUp">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
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
            
            {displayedProjects.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedProjects.slice(0, 6).map((project, index) => (
                  <TiltProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="briefcase" size="lg" className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Coming Soon</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Exciting projects are in development. Check back soon to see what I'm building!
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </ScrollAnimation>
      
      {/* Latest Blog Posts Section - Always show */}
      <ScrollAnimation type="fadeIn">
        <section className="py-6 md:py-8">
          <div className="container-modern">
            <EnhancedAnimatedElement type="slideUp">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div className="relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-secondary-500 to-secondary-600 rounded-full opacity-0 animate-fade-in-left" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}></div>
                  <p className="text-secondary-600 dark:text-secondary-400 font-medium mb-2 flex items-center animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                    <Icon name="pencil" size="sm" className="mr-2" />
                    INSIGHTS
                  </p>
                  <h2 className="heading-2 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>Latest Articles</h2>
                  <div className="mt-2 w-24 h-0.5 bg-gradient-to-r from-secondary-500 to-transparent opacity-0 animate-fade-in-right" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}></div>
                </div>
                <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                  <IconWithText name="arrow-right" iconPosition="right">
                    <Link href="/blog" className="btn-outline mt-4 md:mt-0 hover:scale-105 transition-transform duration-200">
                      View All Articles
                    </Link>
                  </IconWithText>
                </div>
              </div>
            </EnhancedAnimatedElement>
            
            {displayedPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedPosts.slice(0, 6).map((post, index) => (
                  <MorphingBlogCard key={post.id} post={post} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="pencil" size="lg" className="text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Articles Yet</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    I'm working on some great content. Stay tuned for insightful articles about development, technology, and more!
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </ScrollAnimation>
      
      {/* Newsletter Section */}
      <section className="py-6 md:py-8 bg-primary-50 dark:bg-primary-900/10">
        <div className="container-modern">
          <NewsletterSignup
            variant="compact"
            title="Stay in the Loop"
            description="Get notified about new projects, blog posts, and insights on my latest learnings."
            showSocialProof={true}
          />
        </div>
      </section>
    </div>
  );
} 


