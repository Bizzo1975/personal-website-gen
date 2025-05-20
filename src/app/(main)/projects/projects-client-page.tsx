'use client';

import React from 'react';
import Image from 'next/image';
import { ProjectData } from '@/lib/services/project-service';

interface ProjectsClientPageProps {
  projects: ProjectData[];
}

export default function ProjectsClientPage({ projects }: ProjectsClientPageProps) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Projects</h1>
      
      {projects.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">No projects found.</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((project) => (
            <div key={project.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full">
                {project.image ? (
                  <Image 
                    src={project.image} 
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={85}
                    priority={false}
                    style={{objectFit: 'cover'}}
                  />
                ) : (
                  <div className="bg-gray-200 dark:bg-gray-700 h-full w-full flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">No image</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{project.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, techIndex) => (
                    <span 
                      key={techIndex} 
                      className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-4">
                  {project.liveDemo && (
                    <a 
                      href={project.liveDemo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      aria-label={`Visit live demo of ${project.title}`}
                      tabIndex={0}
                    >
                      Live Demo
                    </a>
                  )}
                  {project.sourceCode && (
                    <a 
                      href={project.sourceCode} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      aria-label={`View source code of ${project.title}`}
                      tabIndex={0}
                    >
                      Source Code
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
