import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProjectsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Projects</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        {projects.map((project, index) => (
          <div key={index} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative h-48 w-full">
              <Image 
                src={project.image} 
                alt={project.title}
                fill
                style={{objectFit: 'cover'}}
              />
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
                  >
                    Source Code
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const projects = [
  {
    title: 'E-commerce Platform',
    description: 'A full-featured e-commerce platform built with Next.js, featuring product listings, shopping cart, and payment integration.',
    image: 'https://images.unsplash.com/photo-1557821552-17105176677c',
    technologies: ['Next.js', 'React', 'MongoDB', 'Stripe', 'Tailwind CSS'],
    liveDemo: 'https://example.com/ecommerce',
    sourceCode: 'https://github.com/johndoe/ecommerce'
  },
  {
    title: 'Task Management App',
    description: 'A productivity application for managing tasks, projects, and deadlines with drag-and-drop functionality.',
    image: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91',
    technologies: ['React', 'TypeScript', 'Redux', 'Firebase', 'CSS Modules'],
    liveDemo: 'https://example.com/taskmanager',
    sourceCode: 'https://github.com/johndoe/taskmanager'
  },
  {
    title: 'Weather Dashboard',
    description: 'A responsive weather application that displays current conditions and forecasts based on user location or search.',
    image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b',
    technologies: ['JavaScript', 'React', 'Weather API', 'Chart.js', 'Styled Components'],
    liveDemo: 'https://example.com/weather',
    sourceCode: 'https://github.com/johndoe/weather'
  },
  {
    title: 'Personal Finance Tracker',
    description: 'An application to track income, expenses, and savings with visualization and reporting features.',
    image: 'https://images.unsplash.com/photo-1520695725800-cb80e647a499',
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Tailwind CSS'],
    liveDemo: 'https://example.com/finance',
    sourceCode: 'https://github.com/johndoe/finance'
  }
]; 