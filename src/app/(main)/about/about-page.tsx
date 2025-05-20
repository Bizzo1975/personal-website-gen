'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote';

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
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
          <h2 className="text-red-600 dark:text-red-400 font-bold text-lg mb-2">Error Loading Content</h2>
          <p className="text-red-600 dark:text-red-400">{mdxError}</p>
          <p className="mt-2">Please try refreshing the page or contact the site administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="md:w-1/3">
          <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-lg">
            <Image 
              src={profileData.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'}
              alt={profileData.name || 'Profile Image'} 
              fill 
              style={{objectFit: 'cover'}}
              className="rounded-lg transition-transform hover:scale-105 duration-500"
            />
          </div>
          
          {/* Profile details */}
          <div className="mt-6 space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            {profileData.name && (
              <h2 className="text-xl font-bold">{profileData.name}</h2>
            )}
            
            {profileData.location && (
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {profileData.location}
              </div>
            )}
            
            {profileData.email && (
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a href={`mailto:${profileData.email}`} className="hover:underline">{profileData.email}</a>
              </div>
            )}
            
            {/* Social links */}
            {profileData.socialLinks && (
              <div className="flex items-center space-x-4 pt-2">
                {profileData.socialLinks.github && (
                  <a href={profileData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                
                {profileData.socialLinks.twitter && (
                  <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                )}
                
                {profileData.socialLinks.linkedin && (
                  <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                )}
                
                {profileData.socialLinks.website && (
                  <a href={profileData.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="md:w-2/3">
          {/* Render the markdown content from MongoDB */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {content ? (
              <MDXRemote {...content} />
            ) : (
              <p className="text-yellow-600 dark:text-yellow-400">Content is loading...</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-16">
        <h3 className="text-xl font-bold mb-6">Skills & Technologies</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(profileData.skills || []).map((skill, index) => (
            <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center hover:shadow-md transition-shadow">
              {skill}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
