'use client'
import '@/styles/globals.css';
;

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';

// Mock project data (will be replaced with API calls)
const mockProjects = [
  {
    id: '1',
    title: 'E-commerce Platform',
    slug: 'ecommerce-platform',
    description: 'A full-featured e-commerce platform built with Next.js.',
    image: 'https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    technologies: ['Next.js', 'React', 'MongoDB', 'Stripe', 'Tailwind CSS'],
    liveDemo: 'https://example.com/ecommerce',
    sourceCode: 'https://github.com/johndoe/ecommerce',
    featured: true,
  },
  {
    id: '2',
    title: 'Task Management App',
    slug: 'task-management-app',
    description: 'A productivity application for managing tasks and projects.',
    image: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    technologies: ['React', 'TypeScript', 'Redux', 'Firebase'],
    liveDemo: 'https://example.com/taskmanager',
    sourceCode: 'https://github.com/johndoe/taskmanager',
    featured: false,
  },
  {
    id: '3',
    title: 'Weather Dashboard',
    slug: 'weather-dashboard',
    description: 'A responsive weather application with forecasts.',
    image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    technologies: ['JavaScript', 'React', 'Weather API', 'Chart.js'],
    liveDemo: 'https://example.com/weather',
    sourceCode: 'https://github.com/johndoe/weather',
    featured: true,
  },
  {
    id: '4',
    title: 'Personal Finance Tracker',
    slug: 'personal-finance-tracker',
    description: 'An application to track income, expenses, and savings.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma'],
    liveDemo: 'https://example.com/finance',
    sourceCode: 'https://github.com/johndoe/finance',
    featured: false,
  },
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState(mockProjects);
  
  // Function to handle project deletion
  const handleDeleteProject = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(project => project.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your portfolio projects</p>
        </div>
        <Button href="/admin/projects/new">Add New Project</Button>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id} variant="default" className="overflow-hidden">
            <div className="relative h-48 w-full">
              <Image 
                src={project.image} 
                alt={project.title}
                fill
                style={{objectFit: 'cover'}}
              />
              {project.featured && (
                <div className="absolute top-2 right-2">
                  <Badge variant="primary">Featured</Badge>
                </div>
              )}
            </div>
            <CardBody>
              <h2 className="text-xl font-bold mb-2">{project.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.map((tech, index) => (
                  <Badge key={index} variant="secondary" size="sm">{tech}</Badge>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <div className="space-x-2">
                  <Link 
                    href={`/admin/projects/${project.id}`}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 px-3 py-1 rounded text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
                <div className="flex space-x-2">
                  {project.liveDemo && (
                    <a 
                      href={project.liveDemo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                    >
                      Live Demo
                    </a>
                  )}
                  {project.sourceCode && (
                    <a 
                      href={project.sourceCode} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                    >
                      Source Code
                    </a>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">
            No projects found. Add a new project to get started.
          </p>
        </div>
      )}
    </div>
  );
} 