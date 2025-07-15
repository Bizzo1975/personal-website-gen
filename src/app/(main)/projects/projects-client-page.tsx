'use client';

import React, { useState, useMemo } from 'react';
import { ProjectData } from '@/lib/services/project-service';
import { PageData } from '@/lib/services/page-service';
import FallbackImage from '@/components/FallbackImage';
import HeaderSection from '@/components/HeaderSection';
import { 
  CalendarIcon, 
  ClockIcon, 
  StarIcon,
  UserIcon,
  EyeIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  ChartBarIcon,
  FunnelIcon,
  TagIcon,
  BuildingOfficeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// Enhanced project interface with additional fields
interface EnhancedProject extends ProjectData {
  category?: string;
  projectStatus?: 'completed' | 'in-progress' | 'planned';
  startDate?: string;
  endDate?: string;
  duration?: string;
  client?: string;
  teamSize?: number;
  role?: string;
  challenges?: string[];
  results?: string[];
  testimonial?: {
    text: string;
    author: string;
    position: string;
    company: string;
    avatar: string;
  };
  metrics?: {
    users?: number;
    performance?: string;
    uptime?: string;
    satisfaction?: number;
  };
}

interface ProjectsClientPageProps {
  projects: ProjectData[];
  pageData?: PageData | null;
}

export default function ProjectsClientPage({ projects, pageData }: ProjectsClientPageProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [selectedProject, setSelectedProject] = useState<EnhancedProject | null>(null);

  // Enhanced project data with mock additional fields
  const enhancedProjects: EnhancedProject[] = useMemo(() => {
    const mockEnhancements = [
      {
        category: 'E-commerce',
        projectStatus: 'completed' as const,
        startDate: '2023-08-01',
        endDate: '2023-12-15',
        duration: '4.5 months',
        client: 'TechCorp Solutions',
        teamSize: 4,
        role: 'Full-Stack Developer & Team Lead',
        challenges: ['Complex payment integration', 'Real-time inventory management', 'Mobile responsiveness'],
        results: ['40% increase in conversion rate', '60% faster page load times', '99.9% uptime achieved'],
        testimonial: {
          text: "The team delivered an exceptional e-commerce platform that exceeded our expectations. The attention to detail and technical expertise was outstanding.",
          author: "Sarah Johnson",
          position: "CTO",
          company: "TechCorp Solutions",
          avatar: "/images/testimonials/sarah-johnson.jpg"
        },
        metrics: {
          users: 15000,
          performance: "95% faster",
          uptime: "99.9%",
          satisfaction: 4.8
        },
        featured: true
      },
      {
        category: 'SaaS Platform',
        projectStatus: 'completed' as const,
        startDate: '2023-03-01',
        endDate: '2023-07-30',
        duration: '5 months',
        client: 'StartupXYZ',
        teamSize: 3,
        role: 'Frontend Architect',
        challenges: ['Scalable architecture design', 'Real-time collaboration features', 'Cross-browser compatibility'],
        results: ['Reduced development time by 50%', 'Improved user engagement by 35%', 'Zero critical bugs in production'],
        testimonial: {
          text: "Working with this developer was a game-changer for our startup. The platform they built became the foundation of our success.",
          author: "Mike Chen",
          position: "Founder & CEO",
          company: "StartupXYZ",
          avatar: "/images/testimonials/mike-chen.jpg"
        },
        metrics: {
          users: 8500,
          performance: "80% faster",
          uptime: "99.8%",
          satisfaction: 4.9
        },
        featured: true
      },
      {
        category: 'Portfolio Website',
        projectStatus: 'completed' as const,
        startDate: '2023-01-15',
        endDate: '2023-02-28',
        duration: '1.5 months',
        client: 'Personal Project',
        teamSize: 1,
        role: 'Full-Stack Developer',
        challenges: ['Modern design implementation', 'Performance optimization', 'SEO optimization'],
        results: ['100% Lighthouse score', 'Featured on design showcases', 'Increased client inquiries by 200%'],
        featured: false
      },
      {
        category: 'Mobile App',
        projectStatus: 'in-progress' as const,
        startDate: '2024-01-01',
        duration: '3 months (ongoing)',
        client: 'HealthTech Inc.',
        teamSize: 5,
        role: 'React Native Developer',
        challenges: ['Cross-platform compatibility', 'Offline functionality', 'Healthcare compliance'],
        featured: false
      },
      {
        category: 'Analytics Dashboard',
        projectStatus: 'completed' as const,
        startDate: '2022-10-01',
        endDate: '2023-01-15',
        duration: '3.5 months',
        client: 'DataCorp',
        teamSize: 2,
        role: 'Frontend Developer',
        challenges: ['Real-time data visualization', 'Performance with large datasets', 'Custom chart components'],
        results: ['50% faster data processing', 'Improved decision-making speed', 'User satisfaction score: 4.7/5'],
        metrics: {
          users: 2500,
          performance: "50% faster",
          uptime: "99.5%",
          satisfaction: 4.7
        },
        featured: false
      }
    ];

    return projects.map((project, index) => ({
      ...project,
      ...mockEnhancements[index % mockEnhancements.length]
    }));
  }, [projects]);
  
  // Extract all unique technologies and categories
  const allTechnologies = Array.from(
    new Set(
      enhancedProjects.flatMap(project => project.technologies)
    )
  ).sort();

  const allCategories = Array.from(
    new Set(
      enhancedProjects.map(project => project.category).filter(Boolean)
    )
  ).sort();

  const allStatuses = ['all', 'completed', 'in-progress', 'planned'];
  
  // Filter projects based on selected filters
  const filteredProjects = enhancedProjects.filter(project => {
    const matchesTech = !filter || project.technologies.includes(filter);
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || project.projectStatus === statusFilter;
    
    return matchesTech && matchesCategory && matchesStatus;
  });
    
  // Format page data for HeaderSection
  const headerData = pageData ? {
    headerTitle: pageData.headerTitle || "Projects & Portfolio",
    headerSubtitle: pageData.headerSubtitle || "Explore my latest work and personal projects. Each project represents my passion for creating elegant solutions to complex problems."
  } : {
    headerTitle: "Projects & Portfolio",
    headerSubtitle: "Explore my latest work and personal projects. Each project represents my passion for creating elegant solutions to complex problems."
  };

  return (
    <>
      {/* Header Section */}
      <HeaderSection 
        title={headerData.headerTitle}
        subtitle={headerData.headerSubtitle}
        showSlideshow={true}
        className="bg-gradient-secondary"
        compact={true}
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
