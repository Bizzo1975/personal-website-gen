'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CalendarIcon, 
  ClockIcon, 
  CodeBracketIcon,
  GlobeAltIcon,
  StarIcon as StarOutlineIcon,
  TagIcon,
  UserIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import SocialShare from '@/components/SocialShare';

interface ProjectData {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  image?: string;
  technologies: string[];
  liveDemo?: string;
  sourceCode?: string;
  featured: boolean;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isPreview = searchParams.get('preview') === 'true';
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug, isPreview]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `/api/projects/by-slug/${slug}${isPreview ? '?preview=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Project not found');
        } else {
          throw new Error('Failed to fetch project');
        }
        return;
      }
      
      const data = await response.json();
      const projectData = data.data || data;
      
      setProject({
        id: projectData.id,
        title: projectData.title,
        slug: projectData.slug,
        description: projectData.description,
        content: projectData.content,
        image: projectData.image,
        technologies: projectData.technologies || [],
        liveDemo: projectData.liveDemo || projectData.live_demo,
        sourceCode: projectData.sourceCode || projectData.source_code,
        featured: projectData.featured || false,
        status: projectData.status || 'published',
        createdAt: projectData.createdAt || projectData.created_at,
        updatedAt: projectData.updatedAt || projectData.updated_at
      });
      
    } catch (err) {
      console.error('Failed to fetch project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 h-8 w-32 mb-6 rounded"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-12 w-3/4 mb-4 rounded"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-6 w-1/2 mb-8 rounded"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-64 w-full mb-8 rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-4 w-full rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {error === 'Project not found' ? 'Project Not Found' : 'Error Loading Project'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error === 'Project not found' 
            ? "The project you're looking for doesn't exist or may have been moved." 
            : "Sorry, we couldn't load this project. Please try again later."}
        </p>
        <Link href="/projects" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          <ArrowLeftIcon className="inline h-4 w-4 mr-1" />
          Back to all projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Preview Mode:</strong> You are viewing a preview of this project. This content may not be published yet.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Link href="/projects" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-6 inline-flex items-center">
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to all projects
      </Link>

      <article>
        {/* Project Image */}
        {project.image && (
          <div className="mb-8 rounded-lg overflow-hidden project-detail">
            <Image
              src={project.image}
              alt={project.title}
              width={800}
              height={400}
              className="w-full h-64 object-contain"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                console.log('Project detail image loaded:', {
                  src: project.image,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                  displayWidth: img.offsetWidth,
                  displayHeight: img.offsetHeight
                });
              }}
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {project.featured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                <StarSolidIcon className="h-3 w-3 mr-1" />
                Featured
              </span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              project.status === 'published' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
            }`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {project.title}
          </h1>
          
          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{formatDate(project.createdAt)}</span>
            </div>
            {project.updatedAt && (
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>Updated {formatDate(project.updatedAt)}</span>
              </div>
            )}
          </div>

          {/* Technologies */}
          {project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {project.technologies.map((tech, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Project Description */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            {project.description}
          </p>
          
          {project.content && (
            <div className="mt-6" dangerouslySetInnerHTML={{ __html: project.content }} />
          )}
        </div>

        {/* Project Links */}
        {(project.liveDemo || project.sourceCode) && (
          <div className="flex flex-wrap gap-4 py-6 border-t border-gray-200 dark:border-gray-700">
            {project.liveDemo && (
              <a
                href={project.liveDemo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                View Live Demo
              </a>
            )}
            
            {project.sourceCode && (
              <a
                href={project.sourceCode}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <CodeBracketIcon className="h-5 w-5 mr-2" />
                View Source Code
              </a>
            )}
          </div>
        )}

        {/* Social Share */}
        <div className="py-6 border-t border-gray-200 dark:border-gray-700">
          <SocialShare
            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/projects/${project.slug}`}
            title={project.title}
            description={project.description}
          />
        </div>
      </article>
    </div>
  );
} 