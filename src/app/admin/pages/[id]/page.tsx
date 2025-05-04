'use client'
import '@/styles/globals.css';
;

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';

// Define the PageData interface directly instead of importing it
interface PageData {
  _id: string;
  name: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  updatedAt: Date;
}

// Simple markdown editor component
import dynamic from 'next/dynamic';
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import 'easymde/dist/easymde.min.css';

export default function EditPagePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [pageData, setPageData] = useState<Partial<PageData>>({
    name: '',
    title: '',
    slug: '',
    content: '',
    metaDescription: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch the page data from API
  useEffect(() => {
    const fetchPage = async () => {
      try {
        // Use actual API call with debugging
        console.log(`Fetching page data for ID: ${id}`);
        const response = await fetch(`/api/pages/${id}`);
        
        if (!response.ok) {
          console.error('API response error:', response.status, response.statusText);
          throw new Error(`Failed to fetch page data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched page data:', data);
        setPageData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('Failed to load page. Please check console for details.');
        setLoading(false);
      }
    };

    fetchPage();
  }, [id]);

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
      // Make actual API call to update the page with debugging
      console.log(`Updating page ${id} with data:`, pageData);
      const response = await fetch(`/api/pages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API save error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to save page: ${response.status}`);
      }
      
      // Process successful response
      const result = await response.json();
      console.log('Page updated successfully:', result);
      setSaving(false);
      setSaveSuccess(true);
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push('/admin/pages');
      }, 1000);
    } catch (err: any) {
      console.error('Error saving page:', err);
      setError(err.message || 'Failed to save page');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading page data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
        <Button variant="outline" className="ml-4" onClick={() => router.push('/admin/pages')}>
          Back to Pages
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Page: {pageData.name}</h1>
        <Button variant="outline" onClick={() => router.push('/admin/pages')}>
          Cancel
        </Button>
      </div>

      {saveSuccess && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
          Page saved successfully! Redirecting...
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
                value={pageData.slug || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                required
                disabled={pageData.slug === 'home' || pageData.slug === 'about'}
              />
              {(pageData.slug === 'home' || pageData.slug === 'about') && (
                <p className="text-xs text-gray-500 mt-1">This is a system page and the slug cannot be changed.</p>
              )}
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
                placeholder: 'Write your page content here using Markdown...',
              }}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Page'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 