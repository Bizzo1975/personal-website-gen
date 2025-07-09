'use client'
import '@/styles/globals.css';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card, { CardBody } from '@/components/Card';
import Badge from '@/components/Badge';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import { BiPlusCircle, BiEdit, BiTrash, BiLink, BiCode } from 'react-icons/bi';
import Button from '@/components/Button';
import { AdminInput, AdminTextarea } from '../components/AdminFormField';

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  technologies: string[];
  liveDemo?: string;
  sourceCode?: string;
  featured: boolean;
}

interface ProjectsPage {
  _id?: string;
  headerTitle: string;
  headerSubtitle: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<ProjectsPage>({
    headerTitle: 'My Projects',
    headerSubtitle: 'A showcase of my recent work and projects'
  });
  const [headerLoading, setHeaderLoading] = useState(true);
  const [headerSaving, setHeaderSaving] = useState(false);
  const [headerSaveSuccess, setHeaderSaveSuccess] = useState(false);
  
  useEffect(() => {
    const fetchProjectsPage = async () => {
      try {
        setHeaderLoading(true);
        const response = await fetch('/api/pages');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch pages: ${response.status}`);
        }
        
        const pages = await response.json();
        const projectsPage = pages.find((page: any) => page.slug === 'projects');
        
        if (projectsPage) {
          setPageData({
            _id: projectsPage._id,
            headerTitle: projectsPage.headerTitle || 'My Projects',
            headerSubtitle: projectsPage.headerSubtitle || 'A showcase of my recent work and projects'
          });
        }
        setHeaderLoading(false);
      } catch (err) {
        console.error('Error fetching projects page:', err);
        setHeaderLoading(false);
      }
    };
    
    fetchProjectsPage();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.status}`);
        }
        
        const data = await response.json();
        setProjects(data.projects || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again.');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  const handleHeaderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPageData({
      ...pageData,
      [name]: value
    });
  };
  
  const handleHeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeaderSaving(true);
    
    try {
      let response;
      
      if (pageData._id) {
        // Update existing page
        response = await fetch(`/api/pages/${pageData._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pageData),
          cache: 'no-store',
        });
      } else {
        // Create new page
        response = await fetch('/api/pages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...pageData,
            name: 'Projects Page',
            title: 'Projects',
            slug: 'projects',
            content: ''
          }),
          cache: 'no-store',
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to save page: ${response.status}`);
      }
      
      const result = await response.json();
      
      // If it was a new page, store the ID
      if (!pageData._id && result._id) {
        setPageData({
          ...pageData,
          _id: result._id
        });
      }
      
      // Revalidate the projects page
      await fetch(`/api/revalidate?path=/projects`, { method: 'POST' });
      
      setHeaderSaveSuccess(true);
      setTimeout(() => setHeaderSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving projects page:', err);
    } finally {
      setHeaderSaving(false);
    }
  };
  
  // Function to handle project deletion
  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const response = await fetch(`/api/projects/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete project: ${response.status}`);
        }
        
        // Update state to remove the deleted project
        setProjects(projects.filter(project => project.id !== id));
      } catch (err) {
        console.error('Error deleting project:', err);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  return (
    <AdminLayout title="Projects">
      <AdminPageLayout
        title="Projects"
        description="Manage your portfolio projects"
        action={{
          label: "Add New Project",
          href: "/admin/projects/new",
          icon: <BiPlusCircle />
        }}
      >
        <Card variant="default" className="mb-6">
          <CardBody>
            <h2 className="text-lg font-semibold mb-4">Projects Page Header</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Customize the header that appears at the top of your projects page
            </p>
            
            <form onSubmit={handleHeaderSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="headerTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Header Title
                  </label>
                  <input
                    type="text"
                    id="headerTitle"
                    name="headerTitle"
                    value={pageData.headerTitle}
                    onChange={handleHeaderInputChange}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md dark:bg-slate-800"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="headerSubtitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Header Subtitle
                  </label>
                  <textarea
                    id="headerSubtitle"
                    name="headerSubtitle"
                    value={pageData.headerSubtitle}
                    onChange={handleHeaderInputChange}
                    rows={2}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md dark:bg-slate-800"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={headerSaving}>
                    {headerSaving ? 'Saving...' : 'Save Header'}
                  </Button>
                </div>
                
                {headerSaveSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-2 rounded">
                    Projects page header saved successfully
                  </div>
                )}
              </div>
            </form>
          </CardBody>
        </Card>
        
        {loading ? (
          <Card variant="default">
            <CardBody className="flex justify-center items-center py-20">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading projects...</span>
              </div>
            </CardBody>
          </Card>
        ) : error ? (
          <Card variant="default">
            <CardBody className="text-center py-10">
              <p className="text-red-500 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="primary"
              >
                Retry
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.id} variant="default" className="overflow-hidden">
                <div className="relative h-48 w-full">
                  {project.image ? (
                    <Image 
                      src={project.image} 
                      alt={project.title}
                      fill
                      style={{objectFit: 'cover'}}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-slate-400 dark:text-slate-500">No image</span>
                    </div>
                  )}
                  {project.featured && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="primary">Featured</Badge>
                    </div>
                  )}
                </div>
                <CardBody>
                  <h2 className="text-xl font-bold mb-2">{project.title}</h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
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
                        className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        <BiEdit className="mr-1" /> Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="inline-flex items-center bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 px-3 py-1 rounded text-sm font-medium"
                      >
                        <BiTrash className="mr-1" /> Delete
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      {project.liveDemo && (
                        <a 
                          href={project.liveDemo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                        >
                          <BiLink className="mr-1" /> Live Demo
                        </a>
                      )}
                      {project.sourceCode && (
                        <a 
                          href={project.sourceCode} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                        >
                          <BiCode className="mr-1" /> Source Code
                        </a>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <Card variant="default">
            <CardBody className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="text-slate-400 dark:text-slate-500 text-lg mb-2">
                No projects found
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                Start building your portfolio by adding your first project. Showcase your work with images, descriptions and technologies used.
              </p>
              <Link 
                href="/admin/projects/new" 
                className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <BiPlusCircle className="mr-2" /> Add Your First Project
              </Link>
            </CardBody>
          </Card>
        )}
      </AdminPageLayout>
    </AdminLayout>
  );
} 