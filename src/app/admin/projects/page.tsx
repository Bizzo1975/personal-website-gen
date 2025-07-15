'use client'
import '@/styles/globals.css';

import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '@/components/Card';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import Button from '@/components/Button';

interface ProjectsPage {
  id?: string;
  headerTitle: string;
  headerSubtitle: string;
}

export default function AdminProjectsPage() {
  const [pageData, setPageData] = useState<ProjectsPage>({
    headerTitle: 'My Projects',
    headerSubtitle: 'Explore my portfolio of things I am experimenting on'
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
            id: projectsPage.id,
            headerTitle: projectsPage.headerTitle || 'My Projects',
            headerSubtitle: projectsPage.headerSubtitle || 'Explore my portfolio of things I am experimenting on'
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
      
      if (pageData.id) {
        // Update existing page
        response = await fetch(`/api/pages/${pageData.id}`, {
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
        const errorData = await response.json();
        throw new Error(`Failed to save page: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const result = await response.json();
      
      // If it was a new page, store the ID
      if (!pageData.id && result.page?.id) {
        setPageData({
          ...pageData,
          id: result.page.id
        });
      }
      
      // Revalidate the projects page
      await fetch(`/api/revalidate?path=/projects`, { method: 'POST' });
      
      setHeaderSaveSuccess(true);
      setTimeout(() => setHeaderSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving projects page:', err);
      alert(`Failed to save projects page: ${err.message}`);
    } finally {
      setHeaderSaving(false);
    }
  };

  return (
    <AdminLayout title="Projects">
      <AdminPageLayout
        title="Projects"
        description="Customize your projects page header"
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
        
        {/* Informational note */}
        <Card variant="default">
          <CardBody>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                Individual Project Management
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-3">
                To create, edit, or manage individual projects, please use the Content Management system.
              </p>
              <Button 
                variant="primary" 
                onClick={() => window.location.href = '/admin/content-management?tab=projects'}
              >
                Go to Content Management → Projects
              </Button>
            </div>
          </CardBody>
        </Card>
      </AdminPageLayout>
    </AdminLayout>
  );
} 