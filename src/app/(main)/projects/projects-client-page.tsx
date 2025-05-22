'use client';

import React, { useState } from 'react';
import { ProjectData } from '@/lib/services/project-service';
import { PageData } from '@/lib/services/page-service';
import FallbackImage from '@/components/FallbackImage';
import HeaderSection from '@/components/HeaderSection';

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

interface ProjectsClientPageProps {
  projects: ProjectData[];
  pageData?: PageData | null;
}

export default function ProjectsClientPage({ projects, pageData }: ProjectsClientPageProps) {
  const [filter, setFilter] = useState<string | null>(null);
  
  // Extract all unique technologies from projects
  const allTechnologies = Array.from(
    new Set(
      projects.flatMap(project => project.technologies)
    )
  ).sort();
  
  // Filter projects based on selected technology
  const filteredProjects = filter 
    ? projects.filter(project => project.technologies.includes(filter))
    : projects;
    
  // Format page data for HeaderSection
  const headerData = pageData ? {
    headerTitle: pageData.headerTitle,
    headerSubtitle: pageData.headerSubtitle
  } : undefined;

  return (
    <>
      {/* Header Section */}
      <HeaderSection 
        title="Projects & Portfolio"
        subtitle="Explore my latest work and personal projects. Each project represents my passion for creating elegant solutions to complex problems."
        showSlideshow={true}
        className="bg-gradient-secondary"
        compact={true}
        pageData={headerData}
      />
      
      {/* Projects Section */}
      <section className="section-modern">
        <div className="container-modern">
          {/* Filter Controls */}
          <div className="mb-10">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Filter by:</span>
              <button
                onClick={() => setFilter(null)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  filter === null 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>
              {allTechnologies.map(tech => (
                <button
                  key={tech}
                  onClick={() => setFilter(tech)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                    filter === tech 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>
          
          {filteredProjects.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xl text-slate-500 dark:text-slate-400">No projects found matching your criteria.</p>
              <button 
                onClick={() => setFilter(null)}
                className="mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => (
                <div key={project.id} className="card-project group h-full flex flex-col">
                  <div className="img-hover-zoom h-48 relative">
                    <FallbackImage
                      src={project.image || '/images/projects/placeholder.jpg'}
                      alt={project.title}
                      width={600}
                      height={400}
                      className="w-full h-full object-cover"
                      fallbackSrc="/images/projects/placeholder.jpg"
                      priority={index < 3}
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-xl font-bold mb-3">{project.title}</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4 flex-grow">
                      {project.description}
                    </p>
                    
                    <div className="mt-auto">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.technologies.map((tech, index) => (
                          <span 
                            key={index} 
                            className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex gap-4">
                        {project.liveDemo && (
                          <a 
                            href={project.liveDemo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center"
                            aria-label={`Visit live demo of ${project.title}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Live Demo
                          </a>
                        )}
                        
                        {project.sourceCode && (
                          <a 
                            href={project.sourceCode} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center"
                            aria-label={`View source code of ${project.title}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            Source Code
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
