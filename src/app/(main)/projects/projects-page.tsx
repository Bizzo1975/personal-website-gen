'use client';

import '@/styles/globals.css';
import React from 'react';
import Link from 'next/link';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';

interface ProjectsPageProps {
  projects: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    link?: string;
    slug?: string;
  }[];
}

export default function ProjectsPage({ projects = [] }: ProjectsPageProps) {
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

  // Use provided projects or default to samples
  const displayedProjects = projects.length > 0 ? projects : defaultProjects;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Projects</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          A collection of my development work and side projects
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedProjects.map((project) => (
          <Link key={project.id} href={project.slug || '#'} className="block h-full">
            <Card variant="elevated" className="hover-card h-full">
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
                    <span className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      View Project →
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}