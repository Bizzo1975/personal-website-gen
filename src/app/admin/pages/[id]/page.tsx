'use client'
import '@/styles/globals.css';
;

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardBody, CardHeader, CardFooter } from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import { BiSave } from 'react-icons/bi';

// Define the PageData interface directly instead of importing it
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

// Simple markdown editor component
import dynamic from 'next/dynamic';
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import 'easymde/dist/easymde.min.css';

export default function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { id } = resolvedParams;
  
  const [pageData, setPageData] = useState<Partial<PageData>>({
    name: '',
    title: '',
    slug: '',
    content: '',
    metaDescription: '',
    headerTitle: '',
    headerSubtitle: '',
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
        
        const responseData = await response.json();
        const data = responseData.page || responseData; // Handle both { page: ... } and direct response
        console.log('Fetched page data:', data);
        
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
        const decodedContent = decodeHtmlEntities(data.content || '');
        setPageData({
          ...data,
          content: decodedContent
        });
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
        // Add cache: 'no-store' to ensure the response isn't cached
        cache: 'no-store',
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
      
      // Use Next.js router for navigation instead of window.location
      // This ensures proper handling within the Next.js app
      setTimeout(() => {
        if (pageData.slug === 'about') {
          // For critical pages like about, revalidate by visiting the page first
          fetch(`/api/revalidate?path=/about`, { method: 'POST' })
            .then(() => router.push('/admin/pages'))
            .catch(err => {
              console.error('Error revalidating page:', err);
              router.push('/admin/pages');
            });
        } else {
          router.push('/admin/pages');
        }
      }, 1500);
    } catch (err: any) {
      console.error('Error saving page:', err);
      setError(err.message || 'Failed to save page');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-slate-700 dark:text-slate-200">Loading page data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6 inline-block">
          {error}
        </div>
        <div className="space-x-4">
          <Button onClick={() => window.location.reload()} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}>
            Retry
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/pages')}>
            Back to Pages
          </Button>
        </div>
      </div>
    );
  }

  // Check if this is the About page
  const isAboutPage = pageData.slug === 'about';
  const isSystemPage = pageData.slug === 'home' || pageData.slug === 'about';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Page: {pageData.name}</h1>
        <Button variant="outline" onClick={() => router.push('/admin/pages')}>
          Cancel
        </Button>
      </div>

      {saveSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          Page saved successfully! Redirecting...
        </div>
      )}

      {isAboutPage && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 text-blue-700 dark:text-blue-300 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" /></svg>
            <p>
              <strong>About Page:</strong> To edit profile information, photo, skills, and social links, use the Profile Editor.
            </p>
          </div>
          <Link 
            href="/admin/settings/profile" 
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex-shrink-0"
          >
            Go to Profile Editor
          </Link>
        </div>
      )}

      <Card variant="default">
        <form onSubmit={handleSubmit} className="p-0">
          <CardHeader className="border-b">
            <h2 className="text-lg font-medium">Page Information</h2>
          </CardHeader>
          
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Internal Name"
              id="name"
              name="name"
              value={pageData.name || ''}
              onChange={handleInputChange}
              required
              wrapperClassName="mb-0"
            />
            
            <Input
              label="URL Slug"
              id="slug"
              name="slug"
              value={pageData.slug || ''}
              onChange={handleInputChange}
              required
              disabled={isSystemPage}
              helpText={isSystemPage ? "This is a system page and the slug cannot be changed." : ""}
              wrapperClassName="mb-0"
            />
            
            <Input
              label="Page Title"
              id="title"
              name="title"
              value={pageData.title || ''}
              onChange={handleInputChange}
              required
              wrapperClassName="mb-0 md:col-span-2"
            />
            
            <TextArea
              label="Meta Description"
              id="metaDescription"
              name="metaDescription"
              value={pageData.metaDescription || ''}
              onChange={handleInputChange}
              wrapperClassName="mb-0 md:col-span-2"
              helpText="A brief description for search engines. Recommended length: 150-160 characters."
            />
          </CardBody>
          
          <CardHeader withDivider className="mt-4 border-t">
            <h2 className="text-lg font-medium">Page Header Settings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              These settings control how the page header appears on the frontend.
            </p>
          </CardHeader>
          
          <CardBody className="grid grid-cols-1 gap-6">
            <Input
              label="Header Title"
              id="headerTitle"
              name="headerTitle"
              value={pageData.headerTitle || ''}
              onChange={handleInputChange}
              placeholder="Leave blank to use the page title"
              wrapperClassName="mb-0"
            />
            
            <TextArea
              label="Header Subtitle"
              id="headerSubtitle"
              name="headerSubtitle"
              value={pageData.headerSubtitle || ''}
              onChange={handleInputChange}
              placeholder="A brief description displayed under the header title"
              wrapperClassName="mb-0"
            />
          </CardBody>

          <CardHeader withDivider className="mt-4 border-t">
            <h2 className="text-lg font-medium">Page Content</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Use Markdown to format your content.
            </p>
          </CardHeader>
          
          <CardBody>
            <SimpleMDE
              value={pageData.content || ''}
              onChange={handleContentChange}
              options={{
                spellChecker: false,
                status: false,
                placeholder: 'Write your page content here using Markdown...',
                autofocus: false,
              }}
            />
          </CardBody>

          <CardFooter className="flex justify-end border-t">
            <Button type="submit" disabled={saving} isLoading={saving} icon={<BiSave />}>
              {saving ? 'Saving...' : 'Save Page'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 