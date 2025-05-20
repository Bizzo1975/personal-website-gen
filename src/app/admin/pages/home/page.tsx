'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import AdminPageLayout from '../../components/AdminPageLayout';
import AdminFormLayout from '../../components/AdminFormLayout';
import { AdminInput, AdminTextarea } from '../../components/AdminFormField';
import Card from '@/components/Card';
import Button from '@/components/Button';

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
      <AdminPageLayout
        status={
          saveSuccess 
            ? { type: 'success', message: 'Home page saved successfully! Redirecting...' }
            : undefined
        }
      >
        <AdminFormLayout 
          onSubmit={handleSubmit}
          isSubmitting={saving}
          submitLabel="Save Home Page"
        >
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
          />

          <AdminInput
            id="metaDescription"
            name="metaDescription"
            label="Meta Description"
            value={pageData.metaDescription || ''}
            onChange={handleInputChange}
            helpText="Brief description for search engines (recommended: 150-160 characters)"
          />

          <div className="space-y-1">
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
        </AdminFormLayout>
      </AdminPageLayout>
    </AdminLayout>
  );
} 