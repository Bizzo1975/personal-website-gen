'use client';

import React, { useState, useEffect } from 'react';
import OptimizedImage from '@/components/OptimizedImage';

interface AboutPageProps {
  content: any; // MDX serialized content
  profileData?: {
    name?: string;
    imageUrl?: string;
    skills?: string[];
    location?: string;
    email?: string;
    socialLinks?: {
      github?: string;
      twitter?: string;
      linkedin?: string;
      website?: string;
    };
  };
}

interface SocialLinks {
  github?: string;
  linkedin?: string;
  website?: string;
}

export default function AboutPage({ 
  content, 
  profileData = {
    name: 'John Doe',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    skills: [
      'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 
      'Express', 'MongoDB', 'PostgreSQL', 'HTML5', 'CSS3', 
      'Tailwind CSS', 'Git', 'Docker', 'AWS'
    ],
    location: 'New York, USA',
    email: 'john@example.com'
  } 
}: AboutPageProps) {
  const [mdxError, setMdxError] = useState<string | null>(null);
  const [MDXRemote, setMDXRemote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMDXRemote = async () => {
      try {
        const { MDXRemote: MDXRemoteComponent } = await import('next-mdx-remote');
        setMDXRemote(() => MDXRemoteComponent);
      } catch (error) {
        console.warn('Failed to load MDXRemote:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMDXRemote();
  }, []);

  useEffect(() => {
    // This will detect if the MDX content is not valid
    if (!content || !content.compiledSource) {
      setMdxError('Content could not be loaded properly.');
      console.error('Invalid MDX content received:', content);
    }
  }, [content]);

  // Show error state if there's an issue with MDX content
  if (mdxError) {
    return (
      <div className="container-modern py-20">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl">
          <h2 className="text-red-600 dark:text-red-400 font-bold text-xl mb-4">Error Loading Content</h2>
          <p className="text-red-600 dark:text-red-400">{mdxError}</p>
          <p className="mt-4">Please try refreshing the page or contact the site administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <section className="bg-gradient-secondary text-white py-20">
        <div className="container-modern">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Me</h1>
          <p className="text-xl text-white/90 max-w-3xl">
            Passionate about crafting digital experiences that make a difference. 
            Learn more about my journey, skills, and what drives me as a developer.
          </p>
        </div>
      </section>
      
      {/* Main Content Section */}
      <section className="section-modern">
        <div className="container-modern">
          <div className="grid md:grid-cols-12 gap-12">
            {/* Sidebar / Profile */}
            <div className="md:col-span-4 lg:col-span-3">
              <div className="sticky top-24">
                <div className="img-hover-zoom rounded-xl overflow-hidden mb-6 shadow-lg">
                  <OptimizedImage 
                    src={profileData.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'}
                    alt={profileData.name || 'Profile Image'} 
                    width={400}
                    height={500}
                    className="w-full aspect-[3/4] object-cover"
                  />
                </div>
                
                {/* Profile Details Card */}
                <div className="glass-card p-6 rounded-xl mb-6">
                  {profileData.name && (
                    <h2 className="text-xl font-bold mb-4">{profileData.name}</h2>
                  )}
                  
                  {profileData.location && (
                    <div className="flex items-center text-slate-600 dark:text-slate-300 mb-3">
                      <svg className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profileData.location}
                    </div>
                  )}
                  
                  {profileData.email && (
                    <div className="flex items-center text-slate-600 dark:text-slate-300 mb-3">
                      <svg className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${profileData.email}`} className="hover:text-blue-500 transition-colors duration-200">{profileData.email}</a>
                    </div>
                  )}
                  
                  {/* Social Links */}
                  {profileData.socialLinks && (
                    <div className="flex space-x-6">
                      {profileData.socialLinks.github && (
                        <a 
                          href={profileData.socialLinks.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-700 hover:text-blue-500 dark:text-slate-300 dark:hover:text-blue-400 transition-colors duration-200"
                        >
                          <span className="sr-only">GitHub</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </a>
                      )}
                      {profileData.socialLinks.linkedin && (
                        <a 
                          href={profileData.socialLinks.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-700 hover:text-blue-500 dark:text-slate-300 dark:hover:text-blue-400 transition-colors duration-200"
                        >
                          <span className="sr-only">LinkedIn</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      )}
                      {profileData.socialLinks.website && (
                        <a 
                          href={profileData.socialLinks.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-700 hover:text-blue-500 dark:text-slate-300 dark:hover:text-blue-400 transition-colors duration-200"
                        >
                          <span className="sr-only">Website</span>
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-8 lg:col-span-9">
              {/* About Me Content */}
              <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                ) : content && MDXRemote ? (
                  <MDXRemote {...content} />
                ) : (
                  <p className="text-yellow-600 dark:text-yellow-400">Content could not be loaded.</p>
                )}
              </div>
              
              {/* Skills Section */}
              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-8 mt-12">
                <h3 className="text-2xl font-bold mb-8 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Skills & Technologies
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(profileData.skills || []).map((skill, index) => (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-slate-700/50 rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
