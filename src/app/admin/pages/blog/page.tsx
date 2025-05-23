'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { AdminInput, AdminTextarea } from '../../components/AdminFormField';

// Import SimpleMDE editor
import dynamic from 'next/dynamic';
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import 'easymde/dist/easymde.min.css';

interface PageData {
  _id: string;
  name: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  headerTitle: string;
  headerSubtitle: string;
  updatedAt: Date;
}

export default function AdminBlogPageEditor() {
  const router = useRouter();
  const [pageData, setPageData] = useState<Partial<PageData>>({
    name: 'Blog Page',
    title: 'Blog',
    slug: 'blog',
    content: '',
    metaDescription: '',
    headerTitle: '',
    headerSubtitle: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    const fetchBlogPage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch the specific blog page to ensure we get the latest data
        const response = await fetch('/api/pages?slug=blog');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blog page: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.page) {
          // Set all the page data at once to ensure consistency
          setPageData({
            _id: data.page._id,
            name: data.page.name || 'Blog Page',
            title: data.page.title || 'Blog',
            slug: 'blog',
            content: data.page.content || '',
            metaDescription: data.page.metaDescription || '',
            headerTitle: data.page.headerTitle || 'Blog & Articles',
            headerSubtitle: data.page.headerSubtitle || 'Thoughts, tutorials, and insights on web development, design, and technology.'
          });
        } else {
          // If page doesn't exist, keep the default values
          console.log('Blog page not found, will create a new one on save');
        }
      } catch (err) {
        console.error('Error fetching blog page:', err);
        setError('Failed to load blog page. Please check console for details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogPage();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPageData({
      ...pageData,
      [name]: value,
    });
  };

  const handleContentChange = (value: string) => {
    setPageData({
      ...pageData,
      content: value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    
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
          body: JSON.stringify(pageData),
          cache: 'no-store',
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save page: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Blog page updated successfully:', result);
      setSaving(false);
      setSaveSuccess(true);
      
      // Revalidate the blog page
      await fetch(`/api/revalidate?path=/blog`, { method: 'POST' });
      
      setTimeout(() => {
        router.push('/admin/pages');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving blog page:', err);
      setError(err.message || 'Failed to save page');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout title="Blog Page Editor">
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-4">Loading Blog Page Editor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Blog Page">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {saveSuccess && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            Blog page saved successfully! Redirecting...
          </div>
        )}
        
        <Card variant="default">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Internal Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={pageData.name || 'Blog Page'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                required
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={pageData.title || 'Blog'}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                required
              />
            </div>

            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                value={pageData.metaDescription || ''}
                onChange={handleInputChange}
                rows={2}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                placeholder="Brief description for search engines"
              />
            </div>
            
            <div className="border-t pt-6 border-slate-200 dark:border-slate-700 mt-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Page Header</h3>
              
              <AdminInput
                id="headerTitle"
                name="headerTitle"
                label="Header Title"
                value={pageData.headerTitle || ''}
                onChange={handleInputChange}
                helpText="The main heading displayed at the top of the blog page"
              />
              
              <AdminTextarea
                id="headerSubtitle"
                name="headerSubtitle"
                label="Header Subtitle"
                value={pageData.headerSubtitle || ''}
                onChange={handleInputChange}
                helpText="The subtitle shown below the main heading"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content (Markdown)
              </label>
              <SimpleMDE
                value={pageData.content || ''}
                onChange={handleContentChange}
                options={{
                  spellChecker: false,
                  status: false,
                }}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This content will appear above the blog posts list. Use it to introduce your blog or provide information about your writing.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.push('/admin/pages')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
} 