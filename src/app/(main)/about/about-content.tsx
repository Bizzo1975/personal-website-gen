'use client';

import React, { useMemo } from 'react';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import MarkdownContent from '@/components/MarkdownContent';
import FallbackImage from '@/components/FallbackImage';
import HeaderSection from '@/components/HeaderSection';
import { ProfileData } from '@/lib/services/profile-service';
import { PageData } from '@/lib/services/page-service';

interface AboutContentProps {
  content: MDXRemoteSerializeResult;
  profile: ProfileData;
  pageData?: PageData;
}

export default function AboutContent({ content, profile, pageData }: AboutContentProps) {
  // Create a version of the content without the "About Me" heading
  // This is necessary because the heading is already shown in the HeaderSection
  const filteredContent = useMemo(() => {
    if (!content || !content.compiledSource) return content;
    
    // Create a clone of the content object to avoid mutating the original
    const contentClone = { ...content };
    
    // Replace patterns like "# About Me" at the beginning of the content
    if (typeof contentClone.compiledSource === 'string') {
      contentClone.compiledSource = contentClone.compiledSource
        // Replace MDX compiled h1 with About Me
        .replace(/<h1.*?>About Me<\/h1>/, '')
        // Also remove empty paragraphs that might follow
        .replace(/<p>\s*<\/p>/, '');
    }
    
    return contentClone;
  }, [content]);

  // Format page data for HeaderSection
  const headerData = pageData ? {
    headerTitle: pageData.headerTitle,
    headerSubtitle: pageData.headerSubtitle
  } : undefined;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <HeaderSection 
        title="About Me"
        subtitle="Learn more about my background, experience, and the technologies I work with."
        showSlideshow={true}
        className="bg-gradient-secondary"
        compact={true}
        pageData={headerData}
      />
      
      {/* Main Content */}
      <section className="section-modern">
        <div className="container-modern">
          <div className="grid md:grid-cols-3 gap-12 items-start">
            {/* Sidebar with profile photo and details */}
            <div className="md:col-span-1">
              <div className="sticky top-24">
                {/* Remove all vertical margin/padding from image container */}
                <div className="overflow-hidden rounded-xl">
                  <FallbackImage
                    src={profile?.imageUrl || '/images/placeholder.jpg'}
                    alt={profile?.name || 'Profile Image'}
                    width={400}
                    height={500}
                    className="w-full object-cover"
                    fallbackSrc="/images/placeholder.jpg"
                  />
                </div>
                
                <div className="space-y-6 mt-8">
                  <div>
                    <h3 className="text-lg font-bold mb-3">Contact</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${profile?.email || 'contact@example.com'}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {profile?.email || 'contact@example.com'}
                        </a>
                      </li>
                      {profile?.socialLinks?.website && (
                        <li className="flex items-center space-x-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <a href={profile.socialLinks.website} target="_blank" rel="noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400">
                            {profile.socialLinks.website.replace(/https?:\/\/(www\.)?/, '')}
                          </a>
                        </li>
                      )}
                      {profile?.location && (
                        <li className="flex items-center space-x-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{profile.location}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Social Links */}
                  {profile?.socialLinks && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Connect</h3>
                      <div className="flex flex-wrap gap-3">
                        {profile.socialLinks.github && (
                          <a 
                            href={profile.socialLinks.github} 
                            target="_blank" 
                            rel="noreferrer"
                            aria-label="GitHub"
                            className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <span className="sr-only">GitHub</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.839c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                            </svg>
                          </a>
                        )}
                        {profile.socialLinks.twitter && (
                          <a 
                            href={profile.socialLinks.twitter} 
                            target="_blank" 
                            rel="noreferrer"
                            aria-label="Twitter"
                            className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <span className="sr-only">Twitter</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                          </a>
                        )}
                        {profile.socialLinks.linkedin && (
                          <a 
                            href={profile.socialLinks.linkedin} 
                            target="_blank" 
                            rel="noreferrer"
                            aria-label="LinkedIn"
                            className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <span className="sr-only">LinkedIn</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Main content */}
            <div className="md:col-span-2 prose prose-lg dark:prose-invert max-w-none pt-0">
              <MarkdownContent content={filteredContent} />
              
              {/* Skills section */}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="mt-12 not-prose">
                  <h2 className="text-2xl font-bold mb-6">Skills & Expertise</h2>
                  
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 