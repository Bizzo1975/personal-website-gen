'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import AdminPageLayout from '../../components/AdminPageLayout';
import AdminFormLayout from '../../components/AdminFormLayout';
import { AdminInput, AdminTextarea } from '../../components/AdminFormField';
import Card from '@/components/Card';
import Button from '@/components/Button';
import EnhancedEditor from '@/components/admin/EnhancedEditor';

interface PageData {
  id: string;
  name: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  headerTitle: string;
  headerSubtitle: string;
  heroHeading: string;
  updatedAt: Date;
}

export default function AdminHomePageEditor() {
  const router = useRouter();
  const [pageData, setPageData] = useState<Partial<PageData>>({
    name: '',
    title: '',
    slug: 'home',
    content: '',
    metaDescription: '',
    headerTitle: '',
    headerSubtitle: '',
    heroHeading: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isMetadataCollapsed, setIsMetadataCollapsed] = useState(true);
  
  useEffect(() => {
    const fetchHomePage = async () => {
      try {
        // Fetch all pages and find the home page
        const response = await fetch('/api/pages', {
          cache: 'no-store',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch pages: ${response.status}`);
        }
        
        const allPages = await response.json();
        const homePage = allPages.find((page: PageData) => page.slug === 'home');
        
        if (homePage) {
          console.log('Found home page:', homePage);
          // Decode HTML entities in content to fix garbled text (server-safe method)
          const decodeHtmlEntities = (text: string): string => {
            if (!text) return '';
            // Use server-safe string replacement instead of DOM API
            return text
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&#x27;/g, "'")
              .replace(/&nbsp;/g, ' ')
              .replace(/&#x2F;/g, '/');
          };
          const decodedContent = decodeHtmlEntities(homePage.content || '');
          setPageData({
            ...homePage,
            content: decodedContent
          });
        } else {
          console.log('No home page found, using defaults');
          // If no home page exists, create default data
          setPageData({
            name: 'Home Page',
            title: 'Home - Personal Website',
            slug: 'home',
            content: 'I am a **passionate Full Stack Developer** with extensive experience in building modern, scalable web applications that deliver exceptional user experiences. My expertise spans the complete development lifecycle, from conceptualization and design to deployment and optimization, using cutting-edge technologies including React, Next.js, TypeScript, Node.js, and cloud platforms. I am committed to writing clean, maintainable code while staying current with industry best practices and emerging technologies. Whether working on complex enterprise solutions or innovative startup projects, I bring a detail-oriented approach and genuine enthusiasm for creating digital solutions that make a meaningful impact. I welcome opportunities to collaborate on challenging projects and am always excited to discuss how technology can solve real-world problems.',
            metaDescription: 'Professional Full Stack Developer specializing in modern web technologies, React, Next.js, and scalable application development.',
            headerTitle: 'Welcome to My Website',
            headerSubtitle: 'Full-stack developer specializing in modern web technologies',
            heroHeading: 'Building the Modern Web',
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching home page:', err);
        setError('Failed to load home page. Please check console for details.');
        setLoading(false);
      }
    };
    
    fetchHomePage();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPageData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fixed content change handler for the rich text editor
  const handleContentChange = useCallback((value: string) => {
    setPageData(prev => ({
      ...prev,
      content: value,
    }));
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      console.log('Saving page data:', pageData);
      
      const method = pageData.id ? 'PUT' : 'POST';
      const url = pageData.id ? `/api/pages/${pageData.id}` : '/api/pages';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Failed to save page: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Home page saved successfully:', result);
      setSaving(false);
      setSaveSuccess(true);
      
      // Update pageData with the saved result if it's a new page
      if (!pageData.id && result.page) {
        setPageData(result.page);
      }
      
      // Revalidate the homepage
      try {
        await fetch(`/api/revalidate?path=/`, { method: 'POST' });
      } catch (revalidateError) {
        console.warn('Failed to revalidate homepage:', revalidateError);
      }
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving home page:', err);
      setError(err.message || 'Failed to save page');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout title="Home Page Editor">
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-4">Loading Home Page Editor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Error">
        <div className="text-center py-10">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => router.push('/admin/pages')}>
            Back to Pages
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Edit Home Page">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          {/* Collapsible Edit Home Page Header */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setIsMetadataCollapsed(!isMetadataCollapsed)}
              className="w-full flex items-center justify-between p-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
            >
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Home Page</h1>
              <div className="flex items-center space-x-3">
                <a 
                  href="/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Live Page
                </a>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${
                    isMetadataCollapsed ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {!isMetadataCollapsed && (
              <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                <AdminInput
                  id="name"
                  name="name"
                  label="Internal Name"
                  value={pageData.name || ''}
                  onChange={handleInputChange}
                  required
                />

                <AdminInput
                  id="title"
                  name="title"
                  label="Page Title"
                  value={pageData.title || ''}
                  onChange={handleInputChange}
                  required
                  helpText="The title shown in browser tabs and search results"
                />

                <AdminInput
                  id="metaDescription"
                  name="metaDescription"
                  label="Meta Description"
                  value={pageData.metaDescription || ''}
                  onChange={handleInputChange}
                  helpText="Brief description for search engines (recommended: 150-160 characters)"
                />
              </div>
            )}
          </div>
          
          {/* Status Messages */}
          {saveSuccess && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              Home page saved successfully!
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Homepage Header Fields - Always Visible */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Homepage Header</h3>
            
            <AdminInput
              id="heroHeading"
              name="heroHeading"
              label="Hero Heading"
              value={pageData.heroHeading || ''}
              onChange={handleInputChange}
              helpText="The large main heading in the hero section"
              required
            />
            
            <AdminInput
              id="headerTitle"
              name="headerTitle"
              label="Header Title"
              value={pageData.headerTitle || ''}
              onChange={handleInputChange}
              helpText="The main heading displayed at the top of the homepage"
              required
            />
            
            <AdminTextarea
              id="headerSubtitle"
              name="headerSubtitle"
              label="Header Subtitle"
              value={pageData.headerSubtitle || ''}
              onChange={handleInputChange}
              helpText="The subtitle displayed below the main heading"
              rows={2}
            />
          </div>

          {/* Content Editor */}
          <div className="space-y-1">
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Content
            </label>
            <EnhancedEditor
              value={pageData.content || ''}
              onChange={handleContentChange}
              placeholder="Write your homepage content here..."
              height="400px"
              toolbar="full"
              id="homepage-content-editor"
              ariaLabel="Homepage content rich text editor"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use the toolbar to format your content with headings, bold, italic, lists, links, and more.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/pages')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Home Page'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
