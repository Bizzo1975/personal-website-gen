'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import Button from '@/components/Button';
import Card from '@/components/Card';

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
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    const fetchHomePage = async () => {
      try {
        // Fetch the home page directly using the /api/pages route with a filter
        const response = await fetch('/api/pages');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch pages: ${response.status}`);
        }
        
        const allPages = await response.json();
        const homePage = allPages.find((page: PageData) => page.slug === 'home');
        
        if (homePage) {
          setPageData(homePage);
        } else {
          setError('Home page not found in the database');
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
      if (!pageData._id) {
        throw new Error('Page ID is missing');
      }
      
      const response = await fetch(`/api/pages/${pageData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save page: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Home page updated successfully:', result);
      setSaving(false);
      setSaveSuccess(true);
      
      // Revalidate the homepage
      await fetch(`/api/revalidate?path=/`, { method: 'POST' });
      
      setTimeout(() => {
        router.push('/admin/pages');
      }, 1500);
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
          <Button 
            onClick={() => router.push('/admin/pages')}
          >
            Back to Pages
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Edit Home Page">
      <div className="space-y-6">
        {saveSuccess && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            Home page saved successfully! Redirecting...
          </div>
        )}
        
        <Card variant="default">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Internal Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={pageData.name || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value="home"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">This is a system page and the slug cannot be changed.</p>
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={pageData.title || ''}
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