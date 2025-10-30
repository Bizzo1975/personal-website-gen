'use client';

import React, { useState, useMemo } from 'react';
import { ProjectData } from '@/lib/services/project-service';
import { PageData } from '@/lib/services/page-service';
import FallbackImage from '@/components/FallbackImage';
import HeaderSection from '@/components/HeaderSection';
import NewsletterSignup from '@/components/NewsletterSignup';
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
  AcademicCapIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import TiltProjectCard from '@/components/TiltProjectCard';

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

export default function EnhancedProjectsPage({ projects, pageData }: ProjectsClientPageProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [selectedProject, setSelectedProject] = useState<EnhancedProject | null>(null);
  const [showTechnologies, setShowTechnologies] = useState<boolean>(false);

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

  // Sort projects for timeline view
  const timelineSortedProjects = [...filteredProjects].sort((a, b) => {
    const dateA = new Date(a.startDate || '2023-01-01');
    const dateB = new Date(b.startDate || '2023-01-01');
    return dateB.getTime() - dateA.getTime();
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i}>
        {i < Math.floor(rating) ? (
          <StarSolidIcon className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarIcon className="h-4 w-4 text-gray-300" />
        )}
      </span>
    ));
  };

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
      <section className="py-6 md:py-8">
        <div className="container-modern">
          {/* Filter Controls - Single Line Layout */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="relative flex-shrink-0">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-8 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none min-w-[140px]"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative flex-shrink-0">
                <ChartBarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-8 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white appearance-none min-w-[120px]"
                >
                  {allStatuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Technology Filter Toggle */}
              <button
                onClick={() => setShowTechnologies(!showTechnologies)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showTechnologies 
                    ? 'bg-blue-600 text-white' 
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                <TagIcon className="h-4 w-4" />
                {showTechnologies ? 'Hide Tech' : 'Show Tech'}
              </button>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'timeline'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                  }`}
                >
                  Timeline
                </button>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setFilter(null);
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setShowTechnologies(false);
                }}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>

              {/* Active Filter Indicator */}
              {filter && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400">{filter}</span>
                </span>
              )}
            </div>

            {/* Technology Filter Tags - Only show when toggled */}
            {showTechnologies && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Technologies:</span>
                <button
                  onClick={() => {
                    setFilter(null);
                    setShowTechnologies(false);
                  }}
                  className={`px-2.5 py-1 text-sm rounded-full transition-all ${
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
                    onClick={() => {
                      setFilter(tech);
                      setShowTechnologies(true);
                    }}
                    className={`px-2.5 py-1 text-sm rounded-full transition-all ${
                      filter === tech 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {filteredProjects.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xl text-slate-500 dark:text-slate-400">No projects found matching your criteria.</p>
              <button 
                onClick={() => {
                  setFilter(null);
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <TiltProjectCard 
                  key={project.id} 
                  project={project} 
                  index={index}
                />
              ))}
            </div>
          ) : (
            /* Timeline View */
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="space-y-6">
                {timelineSortedProjects.map((project, index) => (
                  <div key={project.id} className="relative flex items-start">
                    {/* Timeline Dot */}
                    <div className={`absolute left-6 w-4 h-4 rounded-full border-4 border-white dark:border-gray-900 ${
                      project.projectStatus === 'completed' ? 'bg-green-500' :
                      project.projectStatus === 'in-progress' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}></div>
                    
                    {/* Timeline Content */}
                    <div className="ml-16 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 w-full">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            {project.startDate && (
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                <span>
                                  {formatDate(project.startDate)}
                                  {project.endDate && ` - ${formatDate(project.endDate)}`}
                                </span>
                              </div>
                            )}
                            {project.client && (
                              <div className="flex items-center">
                                <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                                <span>{project.client}</span>
                              </div>
                            )}
                            {project.role && (
                              <div className="flex items-center">
                                <UserIcon className="h-4 w-4 mr-1" />
                                <span>{project.role}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(project.projectStatus)}`}>
                          {project.projectStatus?.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.technologies.map((tech, techIndex) => (
                          <span 
                            key={techIndex} 
                            className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-medium text-slate-700 dark:text-slate-300"
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
                          >
                            <GlobeAltIcon className="h-4 w-4 mr-1" />
                            Live Demo
                          </a>
                        )}
                        
                        {project.sourceCode && (
                          <a 
                            href={project.sourceCode} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center"
                          >
                            <CodeBracketIcon className="h-4 w-4 mr-1" />
                            Source Code
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedProject(project)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-6 md:py-8 bg-primary-50 dark:bg-primary-900/10">
        <div className="container-modern">
          <NewsletterSignup
            variant="compact"
            title="Stay in the Loop"
            description="Get notified about new projects, blog posts, and insights on my latest learnings."
            showSocialProof={true}
          />
        </div>
      </section>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedProject.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {selectedProject.client && (
                      <span className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        {selectedProject.client}
                      </span>
                    )}
                    {selectedProject.duration && (
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {selectedProject.duration}
                      </span>
                    )}
                    {selectedProject.teamSize && (
                      <span className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        Team of {selectedProject.teamSize}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Project Image */}
              {selectedProject.image && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <FallbackImage
                    src={selectedProject.image}
                    alt={selectedProject.title}
                    width={800}
                    height={400}
                    className="w-full h-64 object-cover"
                    fallbackSrc="/images/projects/placeholder.jpg"
                  />
                </div>
              )}

              {/* Project Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Project Overview</h3>
                <p className="text-gray-600 dark:text-gray-300">{selectedProject.description}</p>
              </div>

              {/* Technologies */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Technology Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.technologies.map((tech, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Challenges */}
              {selectedProject.challenges && selectedProject.challenges.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Key Challenges</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    {selectedProject.challenges.map((challenge, index) => (
                      <li key={index}>{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Results */}
              {selectedProject.results && selectedProject.results.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Results & Impact</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    {selectedProject.results.map((result, index) => (
                      <li key={index}>{result}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metrics */}
              {selectedProject.metrics && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProject.metrics.users && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedProject.metrics.users.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                      </div>
                    )}
                    {selectedProject.metrics.performance && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {selectedProject.metrics.performance}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Performance</div>
                      </div>
                    )}
                    {selectedProject.metrics.uptime && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {selectedProject.metrics.uptime}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                      </div>
                    )}
                    {selectedProject.metrics.satisfaction && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                          {selectedProject.metrics.satisfaction}/5
                          <StarSolidIcon className="h-5 w-5 ml-1" />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">User Rating</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Testimonial */}
              {selectedProject.testimonial && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Client Testimonial</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                    <blockquote className="text-gray-600 dark:text-gray-300 mb-4 italic">
                      "{selectedProject.testimonial.text}"
                    </blockquote>
                    <div className="flex items-center">
                      {selectedProject.testimonial.avatar && (
                        <FallbackImage
                          src={selectedProject.testimonial.avatar}
                          alt={selectedProject.testimonial.author}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full mr-4"
                          fallbackSrc="/images/placeholder.jpg"
                        />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {selectedProject.testimonial.author}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedProject.testimonial.position}, {selectedProject.testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {selectedProject.liveDemo && (
                  <a 
                    href={selectedProject.liveDemo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                  >
                    <GlobeAltIcon className="h-5 w-5 inline mr-2" />
                    View Live Demo
                  </a>
                )}
                
                {selectedProject.sourceCode && (
                  <a 
                    href={selectedProject.sourceCode} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center font-medium"
                  >
                    <CodeBracketIcon className="h-5 w-5 inline mr-2" />
                    View Source Code
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 